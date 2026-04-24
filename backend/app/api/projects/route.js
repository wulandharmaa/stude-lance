import supabase from '@/utils/supabaseClient';
import { requireAuth, requireRole, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { isValidUuid } from '@/utils/validators';
import { hydrateProjects } from '@/utils/projectQueries';

const PROJECT_STATUS = ['open', 'in_progress', 'completed'];

function parsePage(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function applyProjectFilters(query, { status, category, city, q }) {
  let nextQuery = query;
  if (status) nextQuery = nextQuery.eq('status', status);
  if (category) nextQuery = nextQuery.ilike('category', `%${category}%`);
  if (city) nextQuery = nextQuery.ilike('city', `%${city}%`);
  if (q) nextQuery = nextQuery.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
  return nextQuery;
}

async function fetchProjectsForStudent(profile, filters, from, to) {
  let openQuery = supabase
    .from('projects')
    .select(
      'id, client_id, student_id, title, description, budget, city, category, deadline, status, created_at',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  openQuery = applyProjectFilters(openQuery, filters);

  if (filters.status) {
    if (filters.status === 'open') {
      openQuery = openQuery.eq('status', 'open');
    } else {
      openQuery = openQuery.eq('student_id', profile.id);
    }
  } else {
    openQuery = openQuery.or(`status.eq.open,student_id.eq.${profile.id}`);
  }

  const { data: openProjects, error: openError, count } = await openQuery.range(from, to);
  if (openError) throw new ApiError(500, openError.message);

  const { data: applications, error: applicationError } = await supabase
    .from('project_applications')
    .select('project_id')
    .eq('student_id', profile.id);

  if (applicationError) throw new ApiError(500, applicationError.message);

  const applicationProjectIds = [...new Set((applications || []).map((item) => item.project_id))];
  let appliedProjects = [];
  if (applicationProjectIds.length > 0) {
    let appliedQuery = supabase
      .from('projects')
      .select('id, client_id, student_id, title, description, budget, city, category, deadline, status, created_at')
      .in('id', applicationProjectIds);

    appliedQuery = applyProjectFilters(appliedQuery, filters);
    const { data, error: appliedError } = await appliedQuery;
    if (appliedError) throw new ApiError(500, appliedError.message);
    appliedProjects = data || [];
  }

  const merged = new Map();
  [...(openProjects || []), ...appliedProjects].forEach((project) => {
    merged.set(project.id, project);
  });

  return {
    projects: [...merged.values()].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    total: count || merged.size,
  };
}

export async function GET(request) {
  try {
    const { authUser, profile } = await requireAuth(request);
    if (profile.role !== 'student') requireActiveAccount(profile);

    const { searchParams } = new URL(request.url);
    const page = parsePage(searchParams.get('page'), 1);
    const limit = Math.min(parsePage(searchParams.get('limit'), 12), 50);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const filters = {
      status: searchParams.get('status') || '',
      category: searchParams.get('category') || '',
      city: searchParams.get('city') || '',
      q: searchParams.get('q')?.trim() || '',
    };

    if (filters.status && !PROJECT_STATUS.includes(filters.status)) {
      return error(`status harus salah satu: ${PROJECT_STATUS.join(', ')}`, 400);
    }

    let projects = [];
    let total = 0;

    if (profile.role === 'admin') {
      let query = supabase
        .from('projects')
        .select(
          'id, client_id, student_id, title, description, budget, city, category, deadline, status, created_at',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, to);

      query = applyProjectFilters(query, filters);
      const { data, error: qError, count } = await query;
      if (qError) throw new ApiError(500, qError.message);
      projects = data || [];
      total = count || 0;
    } else if (profile.role === 'client') {
      let query = supabase
        .from('projects')
        .select(
          'id, client_id, student_id, title, description, budget, city, category, deadline, status, created_at',
          { count: 'exact' }
        )
        .eq('client_id', authUser.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      query = applyProjectFilters(query, filters);
      const { data, error: qError, count } = await query;
      if (qError) throw new ApiError(500, qError.message);
      projects = data || [];
      total = count || 0;
    } else {
      const result = await fetchProjectsForStudent({ ...profile, id: authUser.id }, filters, from, to);
      projects = result.projects;
      total = result.total;
    }

    const hydrated = await hydrateProjects(projects, {
      viewerId: authUser.id,
      viewerRole: profile.role,
      includeApplications: true,
    });

    return success('Berhasil mengambil projects', {
      items: hydrated,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.max(Math.ceil((total || 0) / limit), 1),
      },
    });
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}

export async function POST(request) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['client']);
    requireActiveAccount(profile);

    const body = await request.json();
    const {
      title,
      description = null,
      budget,
      city = null,
      category = null,
      deadline = null,
      student_id = null,
      status = 'open',
      milestones = [],
    } = body || {};

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return error('title wajib minimal 3 karakter.', 400);
    }

    const parsedBudget = Number(budget);
    if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
      return error('budget wajib berupa angka >= 0.', 400);
    }

    if (student_id !== null && !isValidUuid(student_id)) {
      return error('student_id harus UUID valid atau null.', 400);
    }

    if (deadline && Number.isNaN(Date.parse(deadline))) {
      return error('deadline tidak valid.', 400);
    }

    if (!PROJECT_STATUS.includes(status)) {
      return error(`status harus salah satu: ${PROJECT_STATUS.join(', ')}`, 400);
    }

    const { data: createdProject, error: createError } = await supabase
      .from('projects')
      .insert({
        client_id: authUser.id,
        student_id,
        title: title.trim(),
        description: description?.trim() || null,
        budget: parsedBudget,
        city: city?.trim() || null,
        category: category?.trim() || null,
        deadline,
        status,
      })
      .select('id, client_id, student_id, title, description, budget, city, category, deadline, status, created_at')
      .single();

    if (createError) throw new ApiError(500, createError.message);

    await supabase.from('project_members').upsert(
      { project_id: createdProject.id, user_id: authUser.id, role: 'client' },
      { onConflict: 'project_id,user_id' }
    );

    if (student_id) {
      await supabase.from('project_members').upsert(
        { project_id: createdProject.id, user_id: student_id, role: 'student' },
        { onConflict: 'project_id,user_id' }
      );
    }

    if (Array.isArray(milestones) && milestones.length > 0) {
      const normalized = milestones
        .filter((item) => item?.title && Number(item?.amount) >= 0)
        .map((item) => ({
          project_id: createdProject.id,
          title: String(item.title).trim(),
          description: item.description?.trim() || null,
          amount: Number(item.amount),
          due_date: item.due_date || null,
          status: item.status || 'pending',
        }));

      if (normalized.length > 0) {
        const { error: milestoneError } = await supabase.from('milestones').insert(normalized);
        if (milestoneError) throw new ApiError(500, milestoneError.message);
      }
    }

    const [hydrated] = await hydrateProjects([createdProject], {
      viewerId: authUser.id,
      viewerRole: profile.role,
      includeApplications: true,
    });

    return success('Project berhasil dibuat', hydrated, 201);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}
