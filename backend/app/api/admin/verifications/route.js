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
      .from('student_verifications')
      .select(`
        id, user_id, ktm_image, status, rejection_reason, created_at,
        users:user_id (id, email, full_name, role, is_active, email_verified_at)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (qError) return error('Gagal mengambil pending verifications', 500, qError.message);

    const mapped = await Promise.all(
      (data || []).map(async (row) => {
        const { data: signed } = await supabaseAdmin.storage
          .from('ktm-images')
          .createSignedUrl(row.ktm_image, 3600);

        return {
          ...row,
          ktm_preview_url: signed?.signedUrl || null,
        };
      })
    );

    return success('Pending verifications berhasil diambil', mapped, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}