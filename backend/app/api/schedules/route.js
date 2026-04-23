import supabase from '@/utils/supabaseClient';
import { requireAuth, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { isValidUuid } from '@/utils/validators';

const SCHEDULE_TYPES = ['academic', 'exam', 'project_deadline'];

function isValidDateTime(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export async function GET(request) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireActiveAccount(profile);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    let query = supabase
      .from('schedules')
      .select('id, user_id, project_id, title, type, start_time, end_time, created_at')
      .eq('user_id', authUser.id)
      .order('start_time', { ascending: true });

    if (projectId) {
      if (!isValidUuid(projectId)) return error('project_id wajib UUID valid.', 400);
      query = query.eq('project_id', projectId);
    }

    const { data, error: qError } = await query;
    if (qError) return error('Gagal mengambil schedules', 500, qError.message);

    return success('Berhasil mengambil schedules', data, 200);
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
    const { project_id = null, title, type, start_time, end_time } = body || {};

    if (project_id !== null && !isValidUuid(project_id)) return error('project_id tidak valid.', 400);
    if (!title || typeof title !== 'string' || title.trim().length < 3) return error('title tidak valid.', 400);
    if (!SCHEDULE_TYPES.includes(type)) return error('type schedule tidak valid.', 400);
    if (!isValidDateTime(start_time) || !isValidDateTime(end_time)) return error('datetime tidak valid.', 400);
    if (new Date(end_time) <= new Date(start_time)) return error('end_time harus setelah start_time.', 400);

    const { data, error: insError } = await supabase
      .from('schedules')
      .insert({
        user_id: authUser.id,
        project_id,
        title: title.trim(),
        type,
        start_time,
        end_time,
      })
      .select('id, user_id, project_id, title, type, start_time, end_time, created_at')
      .single();

    if (insError) return error('Gagal membuat schedule', 500, insError.message);
    return success('Schedule berhasil dibuat', data, 201);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}