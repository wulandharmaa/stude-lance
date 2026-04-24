import supabase from '@/utils/supabaseClient';
import { requireAuth, requireAdmin } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { isValidUuid } from '@/utils/validators';
import { writeAdminAudit } from '@/utils/adminAudit';

export async function PATCH(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireAdmin(profile);

    const id = params.id;
    if (!isValidUuid(id)) return error('id user tidak valid.', 400);
    if (id === authUser.id) return error('Admin tidak boleh reject akun sendiri.', 409);

    const body = await request.json();
    const reason = (body?.reason || '').trim();
    if (reason.length < 5 || reason.length > 255) {
      return error('reason wajib 5-255 karakter.', 400);
    }

    const { data: target, error: targetErr } = await supabase
      .from('users')
      .select('id, role, account_status')
      .eq('id', id)
      .single();

    if (targetErr || !target) return error('User target tidak ditemukan.', 404);
    if (target.role === 'admin') return error('Akun admin tidak bisa direject dari endpoint ini.', 409);
    if (target.account_status !== 'pending') return error('Hanya akun pending yang bisa di-reject.', 409);

    const now = new Date().toISOString();

    const { data, error: updError } = await supabase
      .from('users')
      .update({
        is_active: false,
        account_status: 'rejected',
        account_rejection_reason: reason,
        approved_by: authUser.id,
        approved_at: now,
        is_student_verified: false,
      })
      .eq('id', id)
      .select('id, email, role, is_active, account_status, account_rejection_reason')
      .single();

    if (updError) return error('Gagal reject user.', 500, updError.message);

    await writeAdminAudit({
      adminId: authUser.id,
      action: 'user_rejected',
      targetType: 'user',
      targetId: id,
      payload: { role: target.role, reason },
    });

    return success('Akun user ditolak.', data, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}