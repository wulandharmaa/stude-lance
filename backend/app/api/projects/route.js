import supabase from '@/utils/supabaseClient';
import { requireAuth, requireRole, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { isValidUuid } from '@/utils/validators';

const PROJECT_STATUS = ['open', 'in_progress', 'completed'];

export async function GET(request) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireActiveAccount(profile);

    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get('page') || 1), 1);
    const limit = Math.min(Math.max(Number(searchParams.get('limit') || 10), 1), 50);
    const status = searchParams.get('status');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('projects')
      .select('id, client_id, student_id, title, status, created_at', { count: 'exact' })
      .or(`client_id.eq.${authUser.id},student_id.eq.${authUser.id}`)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);

    const { data, error: qError, count } = await query;
    if (qError) return error('Gagal mengambil projects', 500, qError.message);

    return success('Berhasil mengambil projects', data, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}

export async function POST(request) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['client']);
    requireActiveAccount(profile);

    const body = await request.json();
    const { title, student_id = null, status = 'open' } = body || {};

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return error('title wajib minimal 3 karakter.', 400);
    }

    if (student_id !== null && !isValidUuid(student_id)) {
      return error('student_id harus UUID valid atau null.', 400);
    }

    if (!PROJECT_STATUS.includes(status)) {
      return error(`status harus salah satu: ${PROJECT_STATUS.join(', ')}`, 400);
    }

    const { data, error: insError } = await supabase
      .from('projects')
      .insert({
        client_id: authUser.id,
        student_id,
        title: title.trim(),
        status,
      })
      .select('id, client_id, student_id, title, status, created_at')
      .single();

    if (insError) return error('Gagal membuat project', 500, insError.message);
    return success('Project berhasil dibuat', data, 201);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}