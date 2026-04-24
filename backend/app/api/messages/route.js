import supabase from '@/utils/supabaseClient';
import { requireAuth, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { isValidUuid } from '@/utils/validators';
import { assertProjectMember } from '@/utils/accessControl';
import { hydrateProjects } from '@/utils/projectQueries';

export async function GET(request) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireActiveAccount(profile);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    if (!isValidUuid(projectId)) return error('project_id wajib UUID valid.', 400);

    const project = await assertProjectMember(projectId, authUser.id);
    const [hydrated] = await hydrateProjects([project], {
      viewerId: authUser.id,
      viewerRole: profile.role,
      includeMessages: true,
      includeApplications: false,
    });

    return success('Berhasil mengambil messages', hydrated.messages);
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

    if (insError) throw new ApiError(500, insError.message);

    const [hydrated] = await hydrateProjects(
      [
        {
          ...(await supabase
            .from('projects')
            .select('id, client_id, student_id, title, description, budget, city, category, deadline, status, created_at')
            .eq('id', project_id)
            .single()
            .then(({ data: project, error: qError }) => {
              if (qError) throw new ApiError(500, qError.message);
              return project;
            })),
        },
      ],
      {
        viewerId: authUser.id,
        viewerRole: profile.role,
        includeMessages: true,
        includeApplications: false,
      }
    );

    return success(
      'Message berhasil dikirim',
      hydrated.messages.find((message) => message.id === data.id) || data,
      201
    );
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}
