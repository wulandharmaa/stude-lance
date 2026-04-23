import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { isValidUuid } from '@/utils/validators';
import { requireAuth, requireRole } from '@/utils/authorization';
import { ApiError } from '@/utils/apiError';
import { assertMilestoneProjectClient } from '@/utils/accessControl';

export async function DELETE(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['client']);

    const { id } = params;

    if (!isValidUuid(id)) {
      return NextResponse.json({ message: 'id milestone wajib UUID yang valid.' }, { status: 400 });
    }

    const { milestone } = await assertMilestoneProjectClient(id, authUser.id);

    if (milestone.status === 'approved') {
      return NextResponse.json(
        { message: 'Milestone dengan status approved tidak boleh dihapus.' },
        { status: 409 }
      );
    }

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
      return NextResponse.json({ message: 'Gagal menghapus milestone', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Milestone berhasil dihapus', data }, { status: 200 });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Terjadi kesalahan server', error: err.message }, { status: 500 });
  }
}