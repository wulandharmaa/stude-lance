import supabaseAdmin from '@/utils/supabaseAdmin';
import { ApiError } from '@/utils/apiError';

export async function getAuthContext(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    throw new ApiError(401, 'Token tidak ditemukan.');
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    throw new ApiError(401, 'Token tidak valid atau kedaluwarsa.');
  }

  const { data: profile } = await supabaseAdmin
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
      ktm_image_url
    `)
    .eq('id', data.user.id)
    .maybeSingle();

  return {
    authUser: data.user,
    profile: profile || null,
    token,
  };
}
