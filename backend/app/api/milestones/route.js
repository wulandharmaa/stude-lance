import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { requireAuth, requireRole, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { isValidUuid } from '@/utils/validators';
import { assertProjectClient, assertProjectMember } from '@/utils/accessControl';

const MILESTONE_STATUS = ['pending', 'working', 'approved'];

function isValidDate(value) {
  if (!value) return true;
  return !Number.isNaN(Date.parse(value));
}

export async function GET(request) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireActiveAccount(profile);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!isValidUuid(projectId)) return error('project_id wajib UUID valid.', 400);
    await assertProjectMember(projectId, authUser.id);

    const { data, error: qError } = await supabase
      .from('milestones')
      .select('id, project_id, title, amount, due_date, status, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (qError) return error('Gagal mengambil milestones', 500, qError.message);
    return success('Berhasil mengambil milestones', data, 200);
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
    const { project_id, title, amount, due_date = null, status = 'pending' } = body || {};

    if (!isValidUuid(project_id)) return error('project_id wajib UUID valid.', 400);
    await assertProjectClient(project_id, authUser.id);

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return error('title wajib minimal 3 karakter.', 400);
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) return error('amount tidak valid.', 400);
    if (!isValidDate(due_date)) return error('due_date tidak valid.', 400);
    if (!MILESTONE_STATUS.includes(status)) return error('status milestone tidak valid.', 400);

    const { data, error: insError } = await supabase
      .from('milestones')
      .insert({ project_id, title: title.trim(), amount: parsedAmount, due_date, status })
      .select('id, project_id, title, amount, due_date, status, created_at')
      .single();

    if (insError) return error('Gagal membuat milestone', 500, insError.message);
    return success('Milestone berhasil dibuat', data, 201);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}