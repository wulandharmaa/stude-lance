import supabase from '@/utils/supabaseClient';
import supabaseAdmin from '@/utils/supabaseAdmin';
import { requireAuth, requireAdmin } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { isValidUuid } from '@/utils/validators';
import { writeAdminAudit } from '@/utils/adminAudit';

export async function PATCH(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireAdmin(profile);

    const resolvedParams = await params;
    const id = resolvedParams.id;
    if (!isValidUuid(id)) return error('id user tidak valid.', 400);
    if (id === authUser.id) return error('Admin tidak boleh approve akun sendiri.', 409);

    const { data: target, error: targetErr } = await supabase
      .from('users')
      .select('id, role, account_status, is_student_verified')
      .eq('id', id)
      .single();

    if (targetErr || !target) return error('User target tidak ditemukan.', 404);
    if (target.account_status !== 'pending') return error('Hanya akun pending yang bisa di-approve.', 409);

    if (target.role === 'student' && !target.is_student_verified) {
      return error('User student harus lulus verifikasi KTM sebelum approve akun.', 409);
    }

    const now = new Date().toISOString();

    await supabaseAdmin.auth.admin.updateUserById(id, { email_confirm: true });

    const { data, error: updError } = await supabase
      .from('users')
      .update({
        is_active: true,
        account_status: 'approved',
        account_rejection_reason: null,
        approved_by: authUser.id,
        approved_at: now,
        email_verified_at: now,
      })
      .eq('id', id)
      .select('id, email, role, is_active, account_status, email_verified_at')
      .single();

    if (updError) return error('Gagal approve user.', 500, updError.message);

    await writeAdminAudit({
      adminId: authUser.id,
      action: 'user_approved',
      targetType: 'user',
      targetId: id,
      payload: { role: target.role },
    });

    return success('Akun user disetujui.', data, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}