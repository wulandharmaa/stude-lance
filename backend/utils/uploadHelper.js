import supabaseAdmin from '@/utils/supabaseAdmin';
import { ApiError } from '@/utils/apiError';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function uploadKtmImage(file, userId) {
  if (!file) throw new ApiError(400, 'File KTM wajib diunggah.');
  if (!ALLOWED_MIME.includes(file.type)) throw new ApiError(400, 'Format file harus jpg/png/webp.');
  if (file.size > MAX_SIZE) throw new ApiError(400, 'Ukuran file maksimal 5MB.');

  const ext = file.name?.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from('ktm-images')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new ApiError(500, `Gagal upload KTM: ${error.message}`);

  return path; // bucket private: simpan path
}