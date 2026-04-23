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
    if (!isValidUuid(id)) return error('id user tidak valid.', 400);

    const body = await request.json();
    const reason = (body?.reason || '').trim();
    if (!reason) return error('reason wajib diisi.', 400);

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

    return success('Akun user ditolak.', data, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}