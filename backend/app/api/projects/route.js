import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';

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
    const { searchParams } = new URL(request.url);

    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = Math.min(parsePositiveInt(searchParams.get('limit'), 10), 100);
    const q = searchParams.get('q')?.trim() || '';
    const status = searchParams.get('status');
    const clientId = searchParams.get('client_id');
    const studentId = searchParams.get('student_id');

    if (status && !PROJECT_STATUS.includes(status)) {
      return NextResponse.json(
        { message: `status harus salah satu: ${PROJECT_STATUS.join(', ')}` },
        { status: 400 }
      );
    }

    if (clientId && !isValidUuid(clientId)) {
      return NextResponse.json(
        { message: 'client_id wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    if (studentId && !isValidUuid(studentId)) {
      return NextResponse.json(
        { message: 'student_id wajib UUID yang valid.' },
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
      .order('created_at', { ascending: false });

    if (q) query = query.ilike('title', `%${q}%`);
    if (status) query = query.eq('status', status);
    if (clientId) query = query.eq('client_id', clientId);
    if (studentId) query = query.eq('student_id', studentId);

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
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { client_id, student_id = null, title, status = 'open' } = body || {};

    if (!isValidUuid(client_id)) {
      return NextResponse.json(
        { message: 'client_id wajib UUID yang valid.' },
        { status: 400 }
      );
    }

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

    if (!PROJECT_STATUS.includes(status)) {
      return NextResponse.json(
        { message: `status harus salah satu: ${PROJECT_STATUS.join(', ')}` },
        { status: 400 }
      );
    }

    const payload = {
      client_id,
      student_id,
      title: title.trim(),
      status,
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
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}