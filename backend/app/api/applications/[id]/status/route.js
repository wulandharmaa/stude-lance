import supabase from '@/utils/supabaseClient';
import { requireAuth, requireRole, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { assertProjectClient } from '@/utils/accessControl';
import { isValidUuid } from '@/utils/validators';
import { hydrateProjects } from '@/utils/projectQueries';

const APPLICATION_STATUS = ['accepted', 'rejected'];

export async function PATCH(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['client']);
    requireActiveAccount(profile);

    const { id } = await params;
    if (!isValidUuid(id)) return error('id application tidak valid.', 400);

    const body = await request.json();
    const status = body?.status;
    if (!APPLICATION_STATUS.includes(status)) {
      return error(`status harus salah satu: ${APPLICATION_STATUS.join(', ')}`, 400);
    }

    const { data: application, error: appError } = await supabase
      .from('project_applications')
      .select('id, project_id, student_id, status')
      .eq('id', id)
      .single();

    if (appError || !application) return error('Application tidak ditemukan.', 404);

    const project = await assertProjectClient(application.project_id, authUser.id);

    const { data, error: updateError } = await supabase
      .from('project_applications')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, project_id, student_id, proposal, proposed_budget, status, created_at, updated_at')
      .single();

    if (updateError) throw new ApiError(500, updateError.message);

    if (status === 'accepted') {
      await supabase
        .from('projects')
        .update({
          student_id: application.student_id,
          status: 'in_progress',
        })
        .eq('id', application.project_id);

      await supabase.from('project_members').upsert(
        [
          { project_id: application.project_id, user_id: authUser.id, role: 'client' },
          { project_id: application.project_id, user_id: application.student_id, role: 'student' },
        ],
        { onConflict: 'project_id,user_id' }
      );

      await supabase
        .from('project_applications')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('project_id', application.project_id)
        .neq('id', id)
        .eq('status', 'pending');
    }

    const [hydrated] = await hydrateProjects([project], {
      viewerId: authUser.id,
      viewerRole: profile.role,
      includeApplications: true,
    });

    return success('Status application berhasil diperbarui', {
      application: hydrated.applications.find((item) => item.id === data.id) || data,
      project: hydrated,
    });
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}
