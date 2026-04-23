import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { ApiError } from '@/utils/apiError';
import { requireAuth, requireRole } from '@/utils/authorization';

const PROJECT_STATUS = ['open', 'in_progress', 'completed'];
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export async function GET(request) {
  try {
    const { authUser } = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = Math.min(parsePositiveInt(searchParams.get('limit'), 10), 100);
    const q = searchParams.get('q')?.trim() || '';
    const status = searchParams.get('status');

    if (status && !PROJECT_STATUS.includes(status)) {
      return NextResponse.json(
        { message: `status harus salah satu: ${PROJECT_STATUS.join(', ')}` },
        { status: 400 }
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('projects')
      .select(
        `
        id,
        client_id,
        student_id,
        title,
        status,
        created_at,
        milestones (
          id,
          project_id,
          title,
          amount,
          due_date,
          status
        )
      `,
        { count: 'exact' }
      )
      .or(`client_id.eq.${authUser.id},student_id.eq.${authUser.id}`)
      .order('created_at', { ascending: false });

    if (q) query = query.ilike('title', `%${q}%`);
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query.range(from, to);

    if (error) {
      return NextResponse.json(
        { message: 'Gagal mengambil data projects', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Berhasil mengambil data projects',
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
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['client']);

    const body = await request.json();
    const { student_id = null, title } = body || {};

    if (student_id !== null && !isValidUuid(student_id)) {
      return NextResponse.json(
        { message: 'student_id harus UUID valid atau null.' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json(
        { message: 'title wajib diisi minimal 3 karakter.' },
        { status: 400 }
      );
    }

    const payload = {
      client_id: authUser.id,
      student_id,
      title: title.trim(),
      status: 'open',
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select('id, client_id, student_id, title, status, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { message: 'Gagal membuat project', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Project berhasil dibuat', data },
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