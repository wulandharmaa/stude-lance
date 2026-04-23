import supabase from '@/utils/supabaseClient';
import { requireAuth, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { isValidUuid } from '@/utils/validators';
import { assertProjectMember } from '@/utils/accessControl';

export async function GET(request) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireActiveAccount(profile);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    if (!isValidUuid(projectId)) return error('project_id wajib UUID valid.', 400);

    await assertProjectMember(projectId, authUser.id);

    const { data, error: qError } = await supabase
      .from('messages')
      .select('id, project_id, sender_id, content, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (qError) return error('Gagal mengambil messages', 500, qError.message);
    return success('Berhasil mengambil messages', data, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}

export async function POST(request) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireActiveAccount(profile);

    const body = await request.json();
    const { project_id, content } = body || {};

    if (!isValidUuid(project_id)) return error('project_id wajib UUID valid.', 400);
    if (!content || typeof content !== 'string' || content.trim().length < 1) {
      return error('content wajib diisi.', 400);
    }

    await assertProjectMember(project_id, authUser.id);

    const { data, error: insError } = await supabase
      .from('messages')
      .insert({
        project_id,
        sender_id: authUser.id,
        content: content.trim(),
      })
      .select('id, project_id, sender_id, content, created_at')
      .single();

    if (insError) return error('Gagal mengirim message', 500, insError.message);
    return success('Message berhasil dikirim', data, 201);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}