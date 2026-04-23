import supabase from '@/utils/supabaseClient';
import { requireAuth, requireAdmin } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';

export async function GET(request) {
  try {
    const { profile } = await requireAuth(request);
    requireAdmin(profile);

    const { data, error: qError } = await supabase
      .from('users')
      .select('id, email, full_name, role, email_verified_at, is_active, account_status, account_rejection_reason, created_at')
      .eq('account_status', 'pending')
      .order('created_at', { ascending: true });

    if (qError) return error('Gagal mengambil pending users', 500, qError.message);

    return success('Pending users berhasil diambil', data, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}