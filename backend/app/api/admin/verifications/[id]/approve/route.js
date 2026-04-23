import supabase from '@/utils/supabaseClient';
import { requireAuth, requireAdmin } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { isValidUuid } from '@/utils/validators';

export async function PATCH(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireAdmin(profile);

    const id = params.id;
    if (!isValidUuid(id)) return error('id verifikasi tidak valid.', 400);

    const { data: verif, error: findError } = await supabase
      .from('student_verifications')
      .select('id, user_id, status')
      .eq('id', id)
      .single();

    if (findError || !verif) return error('Data verifikasi tidak ditemukan.', 404);

    const now = new Date().toISOString();

    const { data, error: updError } = await supabase
      .from('student_verifications')
      .update({
        status: 'approved',
        rejection_reason: null,
        verified_by: authUser.id,
        verified_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .select('id, user_id, status, verified_by, verified_at')
      .single();

    if (updError) return error('Gagal approve verifikasi.', 500, updError.message);

    await supabase
      .from('users')
      .update({
        is_student_verified: true,
        is_active: true,
        account_status: 'approved',
        account_rejection_reason: null,
        approved_by: authUser.id,
        approved_at: now,
      })
      .eq('id', verif.user_id);

    return success('Verifikasi mahasiswa disetujui.', data, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}