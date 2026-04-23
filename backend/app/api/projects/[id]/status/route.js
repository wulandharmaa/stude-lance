import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { requireAuth, requireRole, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { assertProjectClient } from '@/utils/accessControl';
import { isValidUuid } from '@/utils/validators';

const PROJECT_STATUS = ['open', 'in_progress', 'completed'];

export async function PATCH(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['client']);
    requireActiveAccount(profile);

    const { id } = params;
    const body = await request.json();
    const { status } = body || {};

    if (!isValidUuid(id)) return error('id project wajib UUID yang valid.', 400);
    if (!PROJECT_STATUS.includes(status)) {
      return error(`status harus salah satu: ${PROJECT_STATUS.join(', ')}`, 400);
    }

    await assertProjectClient(id, authUser.id);

    const { data, error: updError } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', id)
      .select('id, client_id, student_id, title, status, created_at')
      .single();

    if (updError) return error('Gagal mengubah status project', 500, updError.message);
    return success('Status project berhasil diperbarui', data, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}