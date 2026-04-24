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
    if (!isValidUuid(id)) return error('id verifikasi tidak valid.', 400);

    const body = await request.json();
    const reason = (body?.reason || '').trim();
    if (reason.length < 5 || reason.length > 255) {
      return error('reason wajib 5-255 karakter.', 400);
    }

    const { data: verif, error: findError } = await supabase
      .from('student_verifications')
      .select('id, user_id, status')
      .eq('id', id)
      .single();

    if (findError || !verif) return error('Data verifikasi tidak ditemukan.', 404);
    if (verif.status !== 'pending') return error('Verifikasi hanya bisa di-reject dari status pending.', 409);

    const now = new Date().toISOString();

    const { data, error: updError } = await supabase
      .from('student_verifications')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        verified_by: authUser.id,
        verified_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .select('id, user_id, status, rejection_reason, verified_by, verified_at')
      .single();

    if (updError) return error('Gagal reject verifikasi.', 500, updError.message);

    const { error: userUpdateErr } = await supabase
      .from('users')
      .update({
        is_student_verified: false,
        is_active: false,
        account_status: 'rejected',
        account_rejection_reason: reason,
        approved_by: authUser.id,
        approved_at: now,
      })
      .eq('id', verif.user_id);

    if (userUpdateErr) return error('Verifikasi ter-reject, tapi update user gagal.', 500, userUpdateErr.message);

    await writeAdminAudit({
      adminId: authUser.id,
      action: 'verification_rejected',
      targetType: 'student_verification',
      targetId: id,
      payload: { user_id: verif.user_id, reason },
    });

    return success('Verifikasi mahasiswa ditolak.', data, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}