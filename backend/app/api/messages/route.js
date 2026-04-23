import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { isValidUuid, isNonEmptyString } from '@/utils/validators';

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const projectId = searchParams.get('project_id');
    const senderId = searchParams.get('sender_id');
    const q = searchParams.get('q')?.trim() || '';
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = Math.min(parsePositiveInt(searchParams.get('limit'), 20), 100);

    if (!isValidUuid(projectId)) {
      return NextResponse.json(
        { message: 'project_id wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    if (senderId && !isValidUuid(senderId)) {
      return NextResponse.json(
        { message: 'sender_id wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('messages')
      .select('id, project_id, sender_id, content, created_at', { count: 'exact' })
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (senderId) query = query.eq('sender_id', senderId);
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
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { project_id, sender_id, content } = body || {};

    if (!isValidUuid(project_id)) {
      return NextResponse.json(
        { message: 'project_id wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    if (!isValidUuid(sender_id)) {
      return NextResponse.json(
        { message: 'sender_id wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    if (!isNonEmptyString(content, 1)) {
      return NextResponse.json(
        { message: 'content tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        project_id,
        sender_id,
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
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}