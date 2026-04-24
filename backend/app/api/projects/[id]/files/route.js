import supabase from '@/utils/supabaseClient';
import { requireAuth, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { assertProjectMember, assertProjectVisibleToUser } from '@/utils/accessControl';
import { hydrateProjects } from '@/utils/projectQueries';
import { uploadProjectFile } from '@/utils/uploadHelper';
import { isValidUuid } from '@/utils/validators';

export async function GET(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    const { id } = await params;

    if (!isValidUuid(id)) return error('id project tidak valid.', 400);

    await assertProjectVisibleToUser(id, { id: authUser.id, role: profile.role });

    const [hydrated] = await hydrateProjects(
      [
        {
          ...(await supabase
            .from('projects')
            .select('id, client_id, student_id, title, description, budget, city, category, deadline, status, created_at')
            .eq('id', id)
            .single()
            .then(({ data, error: qError }) => {
              if (qError) throw new ApiError(500, qError.message);
              return data;
            })),
        },
      ],
      {
        viewerId: authUser.id,
        viewerRole: profile.role,
        includeFiles: true,
        includeApplications: false,
      }
    );

    return success('Files project berhasil diambil', hydrated.files);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}

export async function POST(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireActiveAccount(profile);

    const { id } = await params;
    if (!isValidUuid(id)) return error('id project tidak valid.', 400);

    await assertProjectMember(id, authUser.id);

    const form = await request.formData();
    const file = form.get('file');
    const path = await uploadProjectFile(file, id, authUser.id);

    const { data, error: insertError } = await supabase
      .from('project_files')
      .insert({
        project_id: id,
        uploader_id: authUser.id,
        storage_path: path,
        file_name: file?.name || 'file',
        file_size: file?.size || 0,
        mime_type: file?.type || 'application/octet-stream',
      })
      .select('id, project_id, uploader_id, storage_path, file_name, file_size, mime_type, created_at')
      .single();

    if (insertError) throw new ApiError(500, insertError.message);

    const [hydrated] = await hydrateProjects(
      [
        {
          ...(await supabase
            .from('projects')
            .select('id, client_id, student_id, title, description, budget, city, category, deadline, status, created_at')
            .eq('id', id)
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
        includeFiles: true,
        includeApplications: false,
      }
    );

    return success(
      'File project berhasil diunggah',
      hydrated.files.find((item) => item.id === data.id) || data,
      201
    );
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}
