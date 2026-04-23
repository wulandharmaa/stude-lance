import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { isValidUuid, isNonEmptyString } from '@/utils/validators';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!isValidUuid(projectId)) {
      return NextResponse.json(
        { message: 'project_id wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('messages')
      .select('id, project_id, sender_id, content, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { message: 'Gagal mengambil data messages', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Berhasil mengambil data messages', data },
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