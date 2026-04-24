import supabase from '@/utils/supabaseClient';
import { requireAuth } from '@/utils/authorization';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';

export async function GET(request) {
  try {
    const { authUser } = await requireAuth(request);

    const { data, error: qError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        city,
        university_name,
        major,
        about,
        skills,
        avatar_url,
        email_verified_at,
        is_active,
        account_status,
        account_rejection_reason,
        approved_by,
        approved_at,
        is_student_verified,
        ktm_image_url,
        created_at
      `)
      .eq('id', authUser.id)
      .single();

    if (qError) throw new ApiError(500, qError.message);
    return success('Profil berhasil diambil', data);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}

export async function PATCH(request) {
  try {
    const { authUser, profile } = await requireAuth(request);
    const body = await request.json();

    const payload = {
      full_name: body?.full_name?.trim() || profile.full_name,
      city: body?.city?.trim() || null,
      university_name: body?.university_name?.trim() || null,
      major: body?.major?.trim() || null,
      about: body?.about?.trim() || null,
      avatar_url: body?.avatar_url?.trim() || null,
      skills: Array.isArray(body?.skills)
        ? body.skills.map((skill) => String(skill).trim()).filter(Boolean)
        : profile.skills || [],
    };

    if (!payload.full_name || payload.full_name.length < 3) {
      return error('full_name wajib minimal 3 karakter.', 400);
    }

    const { data, error: updateError } = await supabase
      .from('users')
      .update(payload)
      .eq('id', authUser.id)
      .select(`
        id,
        email,
        full_name,
        role,
        city,
        university_name,
        major,
        about,
        skills,
        avatar_url,
        email_verified_at,
        is_active,
        account_status,
        account_rejection_reason,
        approved_by,
        approved_at,
        is_student_verified,
        ktm_image_url,
        created_at
      `)
      .single();

    if (updateError) throw new ApiError(500, updateError.message);
    return success('Profil berhasil diperbarui', data);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}
