import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { requireAuth, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { assertMilestoneProjectMember } from '@/utils/accessControl';
import { isValidUuid } from '@/utils/validators';

const MILESTONE_STATUS = ['pending', 'working', 'approved'];

export async function PATCH(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireActiveAccount(profile);

    const { id } = params;
    const body = await request.json();
    const { status } = body || {};

    if (!isValidUuid(id)) return error('id milestone wajib UUID yang valid.', 400);
    if (!MILESTONE_STATUS.includes(status)) {
      return error(`status harus salah satu: ${MILESTONE_STATUS.join(', ')}`, 400);
    }

    await assertMilestoneProjectMember(id, authUser.id);

    const { data, error: updError } = await supabase
      .from('milestones')
      .update({ status })
      .eq('id', id)
      .select('id, project_id, title, amount, due_date, status, created_at')
      .single();

    if (updError) return error('Gagal mengubah status milestone', 500, updError.message);
    return success('Status milestone berhasil diperbarui', data, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}