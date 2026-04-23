import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { isValidUuid } from '@/utils/validators';
import { requireAuth, requireRole } from '@/utils/authorization';
import { ApiError } from '@/utils/apiError';
import { assertProjectClient } from '@/utils/accessControl';

export async function DELETE(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['client']);

    const { id } = params;

    if (!isValidUuid(id)) {
      return NextResponse.json({ message: 'id project wajib UUID yang valid.' }, { status: 400 });
    }

    const project = await assertProjectClient(id, authUser.id);

    if (project.status === 'in_progress') {
      return NextResponse.json(
        { message: 'Project dengan status in_progress tidak boleh dihapus.' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .select('id, title, status')
      .single();

    if (error) {
      return NextResponse.json({ message: 'Gagal menghapus project', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Project berhasil dihapus', data }, { status: 200 });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Terjadi kesalahan server', error: err.message }, { status: 500 });
  }
}