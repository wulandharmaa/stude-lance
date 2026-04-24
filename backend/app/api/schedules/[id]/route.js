import supabase from '@/utils/supabaseClient';
import { requireAuth } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { isValidUuid } from '@/utils/validators';

const SCHEDULE_TYPES = ['academic', 'exam', 'project_deadline'];

function isValidDateTime(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export async function PATCH(request, { params }) {
  try {
    const { authUser } = await requireAuth(request);
    const { id } = await params;

    if (!isValidUuid(id)) return error('id schedule tidak valid.', 400);

    const body = await request.json();
    const payload = {};

    if (body?.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim().length < 3) {
        return error('title tidak valid.', 400);
      }
      payload.title = body.title.trim();
    }

    if (body?.type !== undefined) {
      if (!SCHEDULE_TYPES.includes(body.type)) return error('type schedule tidak valid.', 400);
      payload.type = body.type;
    }

    if (body?.start_time !== undefined) {
      if (!isValidDateTime(body.start_time)) return error('start_time tidak valid.', 400);
      payload.start_time = body.start_time;
    }

    if (body?.end_time !== undefined) {
      if (!isValidDateTime(body.end_time)) return error('end_time tidak valid.', 400);
      payload.end_time = body.end_time;
    }

    if (body?.project_id !== undefined) {
      if (body.project_id !== null && !isValidUuid(body.project_id)) {
        return error('project_id tidak valid.', 400);
      }
      payload.project_id = body.project_id;
    }

    if (payload.start_time && payload.end_time && new Date(payload.end_time) <= new Date(payload.start_time)) {
      return error('end_time harus setelah start_time.', 400);
    }

    const { data, error: updateError } = await supabase
      .from('schedules')
      .update(payload)
      .eq('id', id)
      .eq('user_id', authUser.id)
      .select('id, user_id, project_id, title, type, start_time, end_time, created_at')
      .single();

    if (updateError) throw new ApiError(500, updateError.message);
    return success('Schedule berhasil diperbarui', data);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { authUser } = await requireAuth(request);
    const { id } = await params;

    if (!isValidUuid(id)) return error('id schedule tidak valid.', 400);

    const { data, error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('id', id)
      .eq('user_id', authUser.id)
      .select('id, user_id, title, type')
      .single();

    if (deleteError) throw new ApiError(500, deleteError.message);
    return success('Schedule berhasil dihapus', data);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}
