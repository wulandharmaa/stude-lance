import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { isValidUuid } from '@/utils/validators';
import { ApiError } from '@/utils/apiError';
import { requireAuth } from '@/utils/authorization';

export async function DELETE(request, { params }) {
  try {
    const { authUser } = await requireAuth(request);
    const { id } = params;

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { message: 'id message wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    const { data: message, error: findError } = await supabase
      .from('messages')
      .select('id, sender_id, project_id')
      .eq('id', id)
      .single();

    if (findError) {
      return NextResponse.json(
        { message: 'Message tidak ditemukan', error: findError.message },
        { status: 404 }
      );
    }

    if (message.sender_id !== authUser.id) {
      return NextResponse.json(
        { message: 'Anda tidak berhak menghapus message ini.' },
        { status: 403 }
      );
    }

    const { data, error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)
      .select('id, project_id, sender_id, content, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { message: 'Gagal menghapus message', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Message berhasil dihapus', data },
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