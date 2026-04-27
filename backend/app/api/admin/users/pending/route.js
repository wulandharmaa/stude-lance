import supabase from '@/utils/supabaseClient';
import supabaseAdmin from '@/utils/supabaseAdmin';
import { requireAuth, requireAdmin } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';

export async function GET(request) {
  try {
    const { profile } = await requireAuth(request);
    requireAdmin(profile);

    const { data, error: qError } = await supabase
      .from('users')
      .select('id, email, full_name, role, ktm_image_url, email_verified_at, is_active, account_status, account_rejection_reason, created_at')
      .eq('account_status', 'pending')
      .order('created_at', { ascending: true });

    if (qError) return error('Gagal mengambil pending users', 500, qError.message);

    const mapped = await Promise.all(
      (data || []).map(async (row) => {
        const isAbsoluteUrl = typeof row.ktm_image_url === 'string' && /^https?:\/\//i.test(row.ktm_image_url);

        if (!row.ktm_image_url || isAbsoluteUrl) {
          return {
            ...row,
            ktm_preview_url: isAbsoluteUrl ? row.ktm_image_url : null,
          };
        }

        const { data: signed } = await supabaseAdmin.storage
          .from('ktm-images')
          .createSignedUrl(row.ktm_image_url, 3600);

        return {
          ...row,
          ktm_preview_url: signed?.signedUrl || null,
        };
      })
    );

    return success('Pending users berhasil diambil', mapped, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}