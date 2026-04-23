import supabase from '@/utils/supabaseClient';
import supabaseAdmin from '@/utils/supabaseAdmin';
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

    return success('Akun user disetujui.', data, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}