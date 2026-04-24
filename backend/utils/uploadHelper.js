import supabaseAdmin from '@/utils/supabaseAdmin';
import { ApiError } from '@/utils/apiError';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;
const PROJECT_FILE_MAX_SIZE = 10 * 1024 * 1024;

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

export async function uploadProjectFile(file, projectId, userId) {
  if (!file) throw new ApiError(400, 'File project wajib diunggah.');
  if (file.size > PROJECT_FILE_MAX_SIZE) {
    throw new ApiError(400, 'Ukuran file project maksimal 10MB.');
  }

  const safeName = (file.name || 'file').replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${projectId}/${userId}-${Date.now()}-${safeName}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from('project-files')
    .upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (error) throw new ApiError(500, `Gagal upload file project: ${error.message}`);

  return path;
}
