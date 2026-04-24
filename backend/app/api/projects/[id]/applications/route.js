import supabase from '@/utils/supabaseClient';
import { requireAuth, requireRole, requireStudentApproved, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { assertProjectClient, assertProjectVisibleToUser, getProjectById, getApplicationForStudent } from '@/utils/accessControl';
import { hydrateProjects } from '@/utils/projectQueries';
import { isValidUuid } from '@/utils/validators';

export async function GET(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    const { id } = await params;

    if (!isValidUuid(id)) return error('id project tidak valid.', 400);

    if (profile.role === 'client') {
      await assertProjectClient(id, authUser.id);
    } else if (profile.role === 'student') {
      await assertProjectVisibleToUser(id, { id: authUser.id, role: profile.role });
    }

    const [hydrated] = await hydrateProjects([await getProjectById(id)], {
      viewerId: authUser.id,
      viewerRole: profile.role,
      includeApplications: true,
    });

    const applications =
      profile.role === 'student'
        ? hydrated.applications.filter((application) => application.student_id === authUser.id)
        : hydrated.applications;

    return success('Applications berhasil diambil', applications);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}

export async function POST(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['student']);
    requireStudentApproved(profile);
    requireActiveAccount(profile);

    const { id } = await params;
    if (!isValidUuid(id)) return error('id project tidak valid.', 400);

    const project = await getProjectById(id);
    if (project.status !== 'open') return error('Hanya project open yang bisa dilamar.', 409);
    if (project.student_id) return error('Project ini sudah memiliki mahasiswa terpilih.', 409);

    const existing = await getApplicationForStudent(id, authUser.id);
    if (existing) return error('Anda sudah mengirim proposal untuk project ini.', 409);

    const body = await request.json();
    const proposal = body?.proposal?.trim() || '';
    const proposedBudget =
      body?.proposed_budget !== undefined && body?.proposed_budget !== null
        ? Number(body.proposed_budget)
        : null;

    if (proposal.length < 20) {
      return error('proposal wajib minimal 20 karakter.', 400);
    }

    if (proposedBudget !== null && (Number.isNaN(proposedBudget) || proposedBudget < 0)) {
      return error('proposed_budget tidak valid.', 400);
    }

    const { data, error: insertError } = await supabase
      .from('project_applications')
      .insert({
        project_id: id,
        student_id: authUser.id,
        proposal,
        proposed_budget: proposedBudget,
      })
      .select('id, project_id, student_id, proposal, proposed_budget, status, created_at, updated_at')
      .single();

    if (insertError) throw new ApiError(500, insertError.message);

    const [hydrated] = await hydrateProjects([project], {
      viewerId: authUser.id,
      viewerRole: profile.role,
      includeApplications: true,
    });

    const created = hydrated.applications.find((application) => application.id === data.id) || data;
    return success('Proposal berhasil dikirim', created, 201);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}
