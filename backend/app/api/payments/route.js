import supabase from '@/utils/supabaseClient';
import { requireAuth, requireRole, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { isValidUuid } from '@/utils/validators';
import { assertMilestoneProjectClient, assertMilestoneProjectMember } from '@/utils/accessControl';

const PAYMENT_STATUS = ['pending', 'approved', 'paid', 'failed'];

export async function GET(request) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireActiveAccount(profile);

    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get('milestone_id');
    const projectId = searchParams.get('project_id');

    if (milestoneId) {
      if (!isValidUuid(milestoneId)) return error('milestone_id wajib UUID valid.', 400);
      await assertMilestoneProjectMember(milestoneId, authUser.id);

      const { data, error: qError } = await supabase
        .from('payments')
        .select('id, milestone_id, project_id, amount, platform_fee, status, notes, created_at')
        .eq('milestone_id', milestoneId)
        .order('created_at', { ascending: false });

      if (qError) throw new ApiError(500, qError.message);
      return success('Berhasil mengambil payments', data);
    }

    let accessibleProjectIds = [];
    if (profile.role === 'admin') {
      accessibleProjectIds = [];
    } else if (profile.role === 'client') {
      const { data: ownProjects, error: ownError } = await supabase
        .from('projects')
        .select('id')
        .eq('client_id', authUser.id);
      if (ownError) throw new ApiError(500, ownError.message);
      accessibleProjectIds = (ownProjects || []).map((project) => project.id);
    } else {
      const [{ data: assignedProjects, error: assignedError }, { data: memberships, error: memberError }] =
        await Promise.all([
          supabase.from('projects').select('id').eq('student_id', authUser.id),
          supabase.from('project_members').select('project_id').eq('user_id', authUser.id),
        ]);

      if (assignedError) throw new ApiError(500, assignedError.message);
      if (memberError) throw new ApiError(500, memberError.message);

      accessibleProjectIds = [
        ...(assignedProjects || []).map((project) => project.id),
        ...(memberships || []).map((membership) => membership.project_id),
      ];
    }

    let query = supabase
      .from('payments')
      .select(`
        id,
        milestone_id,
        project_id,
        amount,
        platform_fee,
        status,
        notes,
        created_at,
        milestones (id, title, due_date),
        projects (id, title, city, category, status)
      `)
      .order('created_at', { ascending: false });

    if (projectId) {
      if (!isValidUuid(projectId)) return error('project_id wajib UUID valid.', 400);
      if (profile.role !== 'admin' && !accessibleProjectIds.includes(projectId)) {
        return error('Akses ditolak untuk project ini.', 403);
      }
      query = query.eq('project_id', projectId);
    } else if (profile.role !== 'admin') {
      if (accessibleProjectIds.length === 0) return success('Berhasil mengambil payments', []);
      query = query.in('project_id', [...new Set(accessibleProjectIds)]);
    }

    const { data, error: qError } = await query;
    if (qError) throw new ApiError(500, qError.message);

    return success('Berhasil mengambil payments', data || []);
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
    const { milestone_id, amount, status = 'pending', notes = null } = body || {};

    if (!isValidUuid(milestone_id)) return error('milestone_id wajib UUID valid.', 400);
    const { milestone, project } = await assertMilestoneProjectClient(milestone_id, authUser.id);

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) return error('amount tidak valid.', 400);
    if (!PAYMENT_STATUS.includes(status)) return error('status payment tidak valid.', 400);

    const { data, error: insError } = await supabase
      .from('payments')
      .insert({
        milestone_id,
        project_id: project.id,
        amount: parsedAmount,
        platform_fee: parsedAmount * 0.1,
        status,
        notes,
      })
      .select('id, milestone_id, project_id, amount, platform_fee, status, notes, created_at')
      .single();

    if (insError) throw new ApiError(500, insError.message);

    if (status === 'approved' || status === 'paid') {
      await supabase
        .from('milestones')
        .update({ status: status === 'paid' ? 'paid' : 'approved' })
        .eq('id', milestone_id);
    } else if (status === 'pending') {
      await supabase.from('milestones').update({ status: 'funded' }).eq('id', milestone_id);
    }

    return success('Payment berhasil dibuat', data, 201);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}
