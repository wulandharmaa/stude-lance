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

    const { id } = await params;
    
    if (!isValidUuid(id)) return error('id milestone wajib UUID yang valid.', 400);

    const { milestone } = await assertMilestoneProjectClient(id, authUser.id);

    if (['approved', 'paid'].includes(milestone.status)) {
      return error('Milestone dengan status approved/paid tidak boleh dihapus.', 409);
    }

    const { data: paidPayment, error: payErr } = await supabase
      .from('payments')
      .select('id')
      .eq('milestone_id', id)
      .eq('status', 'paid')
      .limit(1)
      .maybeSingle();

    if (payErr) return error('Gagal memeriksa payment milestone.', 500, payErr.message);
    if (paidPayment) {
      return error('Milestone dengan payment paid tidak boleh dihapus.', 409);
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

export async function PATCH(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['client']);
    requireActiveAccount(profile);

    // Wajib await params
    const { id } = await params;
    
    if (!isValidUuid(id)) return error('id milestone wajib UUID yang valid.', 400);

    // Pastikan milestone ini milik project dari client yang login
    const { milestone } = await assertMilestoneProjectClient(id, authUser.id);

    // Hanya bisa diedit jika status masih pending
    if (milestone.status !== 'pending') {
      return error('Hanya milestone dengan status pending yang bisa diedit.', 409);
    }

    const body = await request.json();
    const { title, description, amount, due_date } = body;

    // Siapkan data yang akan diupdate (hanya field yang dikirim yang diupdate)
    const payload = {};
    if (title) payload.title = title.trim();
    if (description !== undefined) payload.description = description?.trim() || null;
    if (amount !== undefined) payload.amount = Number(amount);
    if (due_date !== undefined) payload.due_date = due_date;

    payload.updated_at = new Date().toISOString();

    const { data, error: updateError } = await supabase
      .from('milestones')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) return error('Gagal update milestone', 500, updateError.message);
    return success('Milestone berhasil diperbarui', data, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}