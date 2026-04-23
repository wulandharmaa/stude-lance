import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { isValidUuid, isNonEmptyString } from '@/utils/validators';
import { ApiError } from '@/utils/apiError';
import { requireAuth } from '@/utils/authorization';

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

async function ensureProjectMember(projectId, userId) {
  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .or(`client_id.eq.${userId},student_id.eq.${userId}`)
    .maybeSingle();

  return !!data;
}

export async function GET(request) {
  try {
    const { authUser } = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const projectId = searchParams.get('project_id');
    const q = searchParams.get('q')?.trim() || '';
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = Math.min(parsePositiveInt(searchParams.get('limit'), 20), 100);

    if (!isValidUuid(projectId)) {
      return NextResponse.json(
        { message: 'project_id wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    const isMember = await ensureProjectMember(projectId, authUser.id);
    if (!isMember) {
      return NextResponse.json(
        { message: 'Akses ditolak untuk project ini.' },
        { status: 403 }
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('messages')
      .select('id, project_id, sender_id, content, created_at', { count: 'exact' })
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (q) query = query.ilike('content', `%${q}%`);

    const { data, error, count } = await query.range(from, to);

    if (error) {
      return NextResponse.json(
        { message: 'Gagal mengambil data messages', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Berhasil mengambil data messages',
        data,
        meta: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }

    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { authUser } = await requireAuth(request);
    const body = await request.json();
    const { project_id, content } = body || {};

    if (!isValidUuid(project_id)) {
      return NextResponse.json(
        { message: 'project_id wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    if (!isNonEmptyString(content, 1)) {
      return NextResponse.json(
        { message: 'content tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const isMember = await ensureProjectMember(project_id, authUser.id);
    if (!isMember) {
      return NextResponse.json(
        { message: 'Akses ditolak untuk project ini.' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        project_id,
        sender_id: authUser.id,
        content: content.trim(),
      })
      .select('id, project_id, sender_id, content, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { message: 'Gagal membuat message', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Message berhasil dibuat', data },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }

    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}