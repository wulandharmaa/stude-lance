import supabase from '@/utils/supabaseClient';
import { requireAuth, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { assertMilestoneProjectMember, assertMilestoneProjectClient } from '@/utils/accessControl';
import { isValidUuid } from '@/utils/validators';

const MILESTONE_STATUS = ['pending', 'funded', 'working', 'approved', 'paid'];

export async function PATCH(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireActiveAccount(profile);

    const { id } = await params;
    const body = await request.json();
    const { status } = body || {};

    if (!isValidUuid(id)) return error('id milestone wajib UUID yang valid.', 400);
    if (!MILESTONE_STATUS.includes(status)) {
      return error(`status harus salah satu: ${MILESTONE_STATUS.join(', ')}`, 400);
    }

    if (status === 'paid') {
      await assertMilestoneProjectClient(id, authUser.id);
    } else {
      await assertMilestoneProjectMember(id, authUser.id);
    }

    const { milestone } = await assertMilestoneProjectMember(id, authUser.id);

    const { data, error: updError } = await supabase
      .from('milestones')
      .update({ status })
      .eq('id', id)
      .select('id, project_id, title, description, amount, due_date, status, created_at')
      .single();

    if (updError) throw new ApiError(500, updError.message);

    if (status === 'paid') {
      const { data: paymentExists, error: payError } = await supabase
        .from('payments')
        .select('id')
        .eq('milestone_id', id)
        .eq('status', 'paid')
        .limit(1)
        .maybeSingle();

      if (payError) throw new ApiError(500, payError.message);

      if (!paymentExists) {
        await supabase.from('payments').insert({
          milestone_id: id,
          project_id: milestone.project_id,
          amount: milestone.amount,
          platform_fee: Number(milestone.amount || 0) * 0.1,
          status: 'paid',
          notes: 'Milestone dibayar melalui simulasi micro-milestone.',
        });
      }
    }

    return success('Status milestone berhasil diperbarui', data);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}
