import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { requireAuth, requireRole, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { assertMilestoneProjectClient } from '@/utils/accessControl';
import { isValidUuid } from '@/utils/validators';

export async function DELETE(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['client']);
    requireActiveAccount(profile);

    const { id } = params;
    if (!isValidUuid(id)) return error('id milestone wajib UUID yang valid.', 400);

    const { milestone } = await assertMilestoneProjectClient(id, authUser.id);

    if (milestone.status === 'approved') {
      return error('Milestone dengan status approved tidak boleh dihapus.', 409);
    }

    const { data: successPayment, error: payErr } = await supabase
      .from('payments')
      .select('id')
      .eq('milestone_id', id)
      .eq('status', 'success')
      .limit(1)
      .maybeSingle();

    if (payErr) return error('Gagal memeriksa payment milestone.', 500, payErr.message);
    if (successPayment) {
      return error('Milestone dengan payment success tidak boleh dihapus.', 409);
    }

    const { data, error: delError } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id)
      .select('id, project_id, title, status')
      .single();

    if (delError) return error('Gagal menghapus milestone', 500, delError.message);
    return success('Milestone berhasil dihapus', data, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}