import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SCHEDULE_TYPES = ['academic', 'exam', 'project_deadline'];

function isValidUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function isValidDateTime(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const projectId = searchParams.get('project_id');

    if (!userId && !projectId) {
      return NextResponse.json(
        { message: 'Gunakan minimal satu filter: user_id atau project_id.' },
        { status: 400 }
      );
    }

    if (userId && !isValidUuid(userId)) {
      return NextResponse.json(
        { message: 'user_id wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    if (projectId && !isValidUuid(projectId)) {
      return NextResponse.json(
        { message: 'project_id wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('schedules')
      .select('id, user_id, project_id, title, type, start_time, end_time, created_at')
      .order('start_time', { ascending: true });

    if (userId) query = query.eq('user_id', userId);
    if (projectId) query = query.eq('project_id', projectId);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { message: 'Gagal mengambil data schedules', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Berhasil mengambil data schedules', data },
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
    const {
      user_id,
      project_id = null,
      title,
      type,
      start_time,
      end_time,
    } = body || {};

    if (!isValidUuid(user_id)) {
      return NextResponse.json(
        { message: 'user_id wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    if (project_id !== null && !isValidUuid(project_id)) {
      return NextResponse.json(
        { message: 'project_id harus UUID valid atau null.' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json(
        { message: 'title wajib diisi minimal 3 karakter.' },
        { status: 400 }
      );
    }

    if (!SCHEDULE_TYPES.includes(type)) {
      return NextResponse.json(
        { message: `type harus salah satu: ${SCHEDULE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!isValidDateTime(start_time) || !isValidDateTime(end_time)) {
      return NextResponse.json(
        { message: 'start_time dan end_time harus datetime valid (ISO string).' },
        { status: 400 }
      );
    }

    if (new Date(end_time) <= new Date(start_time)) {
      return NextResponse.json(
        { message: 'end_time harus lebih besar dari start_time.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('schedules')
      .insert({
        user_id,
        project_id,
        title: title.trim(),
        type,
        start_time,
        end_time,
      })
      .select('id, user_id, project_id, title, type, start_time, end_time, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { message: 'Gagal membuat schedule', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Schedule berhasil dibuat', data },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}