import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { requireAuth, requireRole, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { isValidUuid } from '@/utils/validators';
import { assertMilestoneProjectClient, assertMilestoneProjectMember } from '@/utils/accessControl';

const PAYMENT_STATUS = ['pending', 'success', 'failed'];

export async function GET(request) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireActiveAccount(profile);

    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get('milestone_id');
    if (!isValidUuid(milestoneId)) return error('milestone_id wajib UUID valid.', 400);

    await assertMilestoneProjectMember(milestoneId, authUser.id);

    const { data, error: qError } = await supabase
      .from('payments')
      .select('id, milestone_id, amount, status, created_at')
      .eq('milestone_id', milestoneId)
      .order('created_at', { ascending: false });

    if (qError) return error('Gagal mengambil payments', 500, qError.message);
    return success('Berhasil mengambil payments', data, 200);
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
    const { milestone_id, amount, status = 'pending' } = body || {};

    if (!isValidUuid(milestone_id)) return error('milestone_id wajib UUID valid.', 400);
    await assertMilestoneProjectClient(milestone_id, authUser.id);

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) return error('amount tidak valid.', 400);
    if (!PAYMENT_STATUS.includes(status)) return error('status payment tidak valid.', 400);

    const { data, error: insError } = await supabase
      .from('payments')
      .insert({ milestone_id, amount: parsedAmount, status })
      .select('id, milestone_id, amount, status, created_at')
      .single();

    if (insError) return error('Gagal membuat payment', 500, insError.message);
    return success('Payment berhasil dibuat', data, 201);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}