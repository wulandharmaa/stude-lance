import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { isValidUuid } from '@/utils/validators';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { message: 'id project wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    const { data: project, error: findError } = await supabase
      .from('projects')
      .select('id, status, title')
      .eq('id', id)
      .single();

    if (findError) {
      return NextResponse.json(
        { message: 'Project tidak ditemukan', error: findError.message },
        { status: 404 }
      );
    }

    // Soft guard: project yang sedang berjalan tidak boleh dihapus
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
      return NextResponse.json(
        { message: 'Gagal menghapus project', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Project berhasil dihapus', data },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}