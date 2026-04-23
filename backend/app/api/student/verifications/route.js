import supabase from '@/utils/supabaseClient';
import { requireAuth, requireRole } from '@/utils/authorization';
import { uploadKtmImage } from '@/utils/uploadHelper';
import { success, error } from '@/utils/apiResponse';
import { ApiError } from '@/utils/apiError';

export async function GET(request) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['student']);

    const { data, error: findError } = await supabase
      .from('student_verifications')
      .select('id, user_id, ktm_image, status, rejection_reason, verified_by, verified_at, created_at')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) return error('Gagal mengambil status verifikasi', 500, findError.message);

    return success('Status verifikasi berhasil diambil', data, 200);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}

export async function POST(request) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['student']);

    if (!profile.email_verified_at) {
      return error('Email belum terverifikasi.', 403);
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('student_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', authUser.id)
      .gte('created_at', since);

    if ((count || 0) >= 5) {
      return error('Batas upload tercapai. Coba lagi besok.', 429);
    }

    const { data: pending } = await supabase
      .from('student_verifications')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle();

    if (pending) return error('Masih ada pengajuan pending. Tunggu review admin.', 409);

    const form = await request.formData();
    const file = form.get('ktm_image');
    const path = await uploadKtmImage(file, authUser.id);

    const { data, error: insertError } = await supabase
      .from('student_verifications')
      .insert({
        user_id: authUser.id,
        ktm_image: path,
        status: 'pending',
      })
      .select('id, user_id, ktm_image, status, rejection_reason, created_at')
      .single();

    if (insertError) return error('Gagal membuat pengajuan verifikasi', 500, insertError.message);

    await supabase
      .from('users')
      .update({ ktm_image_url: path, is_student_verified: false })
      .eq('id', authUser.id);

    return success('Pengajuan verifikasi KTM berhasil dikirim', data, 201);
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}