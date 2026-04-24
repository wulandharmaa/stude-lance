import { getAuthContext } from '@/utils/auth';
import { ApiError } from '@/utils/apiError';
import { success, error } from '@/utils/apiResponse';

export async function GET(request) {
  try {
    const { authUser, profile } = await getAuthContext(request);

    return success('Berhasil mengambil profil auth user', {
      auth_user: {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at,
      },
      profile,
    });
  } catch (err) {
    if (err instanceof ApiError) return error(err.message, err.status);
    return error('Terjadi kesalahan server', 500, err.message);
  }
}
