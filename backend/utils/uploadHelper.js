import supabase from '@/utils/supabaseClient';

const KTM_BUCKET = 'ktm-images';

export async function uploadKtmImage({ userId, file }) {
  if (!userId) {
    throw new Error('userId wajib diisi.');
  }

  if (!file) {
    throw new Error('File KTM wajib diisi.');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Format file tidak valid. Gunakan JPG, PNG, atau WEBP.');
  }

  const ext = file.name?.split('.').pop() || 'jpg';
  const filePath = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(KTM_BUCKET)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Upload KTM gagal: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(KTM_BUCKET)
    .getPublicUrl(filePath);

  return {
    bucket: KTM_BUCKET,
    path: filePath,
    publicUrl: publicUrlData.publicUrl,
  };
}