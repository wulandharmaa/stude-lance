import supabase from '@/utils/supabaseClient';
import { requireAuth, requireRole, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { assertProjectClient } from '@/utils/accessControl';
import { isValidUuid } from '@/utils/validators';

export async function DELETE(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['client']);
    requireActiveAccount(profile);

    const { id } = params;
    if (!isValidUuid(id)) return error('id project wajib UUID yang valid.', 400);

    const project = await assertProjectClient(id, authUser.id);
    if (project.status === 'in_progress') {
      return error('Project dengan status in_progress tidak boleh dihapus.', 409);
    }

    const { data, error: delError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .select('id, title, status')
      .single();

    if (delError) return error('Gagal menghapus project', 500, delError.message);
    return success('Project berhasil dihapus', data, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}