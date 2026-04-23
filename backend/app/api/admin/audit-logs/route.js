import supabase from '@/utils/supabaseClient';
import { requireAuth, requireAdmin } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';

export async function GET(request) {
  try {
    const { profile } = await requireAuth(request);
    requireAdmin(profile);

    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get('page') || 1), 1);
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 20), 1), 100);
    const action = searchParams.get('action');
    const adminId = searchParams.get('admin_id');

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('admin_audit_logs')
      .select('id, admin_id, action, target_type, target_id, payload, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (action) query = query.eq('action', action);
    if (adminId) query = query.eq('admin_id', adminId);

    const { data, error: qError, count } = await query;
    if (qError) return error('Gagal mengambil audit logs', 500, qError.message);

    return success('Audit logs berhasil diambil', {
      items: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.max(Math.ceil((count || 0) / limit), 1),
      },
    });
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}