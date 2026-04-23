import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { isValidUuid } from '@/utils/validators';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { message: 'id milestone wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    const { data: milestone, error: findError } = await supabase
      .from('milestones')
      .select('id, status, title')
      .eq('id', id)
      .single();

    if (findError) {
      return NextResponse.json(
        { message: 'Milestone tidak ditemukan', error: findError.message },
        { status: 404 }
      );
    }

    // Soft guard: milestone approved tidak boleh dihapus
    if (milestone.status === 'approved') {
      return NextResponse.json(
        { message: 'Milestone dengan status approved tidak boleh dihapus.' },
        { status: 409 }
      );
    }

    // Soft guard: jika sudah ada payment paid, block delete
    const { data: paidPayment } = await supabase
      .from('payments')
      .select('id')
      .eq('milestone_id', id)
      .eq('status', 'paid')
      .limit(1)
      .maybeSingle();

    if (paidPayment) {
      return NextResponse.json(
        { message: 'Milestone dengan payment paid tidak boleh dihapus.' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id)
      .select('id, project_id, title, status')
      .single();

    if (error) {
      return NextResponse.json(
        { message: 'Gagal menghapus milestone', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Milestone berhasil dihapus', data },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}