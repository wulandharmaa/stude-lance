import { getAuthContext } from '@/utils/auth';
import { ApiError } from '@/utils/apiError';

export async function requireAuth(request) {
  const { authUser, profile } = await getAuthContext(request);

  if (!profile) {
    throw new ApiError(403, 'Profil user belum terdaftar di tabel users.');
  }

  return { authUser, profile };
}

export function requireRole(profile, roles = []) {
  if (!roles.includes(profile.role)) {
    throw new ApiError(403, `Akses ditolak. Role yang diizinkan: ${roles.join(', ')}`);
  }
}