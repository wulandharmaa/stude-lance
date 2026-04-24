import supabase from '@/utils/supabaseClient';
import { requireAuth, requireRole, requireActiveAccount } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';
import { hydrateProjects } from '@/utils/projectQueries';
import { assertProjectClient, assertProjectVisibleToUser, getProjectById } from '@/utils/accessControl';
import { isValidUuid } from '@/utils/validators';

export async function GET(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    const { id } = await params;

    if (!isValidUuid(id)) return error('id project wajib UUID yang valid.', 400);

    const project = await assertProjectVisibleToUser(id, {
      id: authUser.id,
      role: profile.role,
    });

    const [hydrated] = await hydrateProjects([project], {
      viewerId: authUser.id,
      viewerRole: profile.role,
      includeMessages: true,
      includeFiles: true,
      includeApplications: true,
    });

    if (profile.role === 'student' && !profile.is_active) {
      hydrated.permissions.can_apply = false;
      hydrated.permissions.can_message = hydrated.permissions.is_member;
      hydrated.permissions.can_upload_files = hydrated.permissions.is_member;
      hydrated.requires_verification = true;
    }

    return success('Berhasil mengambil detail project', hydrated);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}

export async function DELETE(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['client']);
    requireActiveAccount(profile);

    const { id } = await params;
    if (!isValidUuid(id)) return error('id project wajib UUID yang valid.', 400);

    const project = await assertProjectClient(id, authUser.id);
    if (project.status === 'in_progress') {
      return error('Project dengan status in_progress tidak boleh dihapus.', 409);
    }

    const { data, error: delError } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .select('id, title, status')
      .single();

    if (delError) throw new ApiError(500, delError.message);
    return success('Project berhasil dihapus', data);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}

export async function PATCH(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['client']);
    requireActiveAccount(profile);

    const { id } = await params;
    if (!isValidUuid(id)) return error('id project wajib UUID yang valid.', 400);

    await assertProjectClient(id, authUser.id);
    const current = await getProjectById(id);

    const body = await request.json();
    const payload = {
      title: body?.title?.trim() || current.title,
      description: body?.description?.trim() ?? current.description,
      budget: body?.budget !== undefined ? Number(body.budget) : Number(current.budget || 0),
      city: body?.city?.trim() ?? current.city,
      category: body?.category?.trim() ?? current.category,
      deadline: body?.deadline ?? current.deadline,
      status: body?.status ?? current.status,
    };

    if (!payload.title || payload.title.length < 3) {
      return error('title wajib minimal 3 karakter.', 400);
    }

    if (Number.isNaN(payload.budget) || payload.budget < 0) {
      return error('budget wajib angka >= 0.', 400);
    }

    const { data, error: updateError } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select('id, client_id, student_id, title, description, budget, city, category, deadline, status, created_at')
      .single();

    if (updateError) throw new ApiError(500, updateError.message);

    const [hydrated] = await hydrateProjects([data], {
      viewerId: authUser.id,
      viewerRole: profile.role,
      includeApplications: true,
    });

    return success('Project berhasil diperbarui', hydrated);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}
