import { getAuthContext } from '@/utils/auth';
import { ApiError } from '@/utils/apiError';

export async function requireAuth(request) {
  const { authUser, profile } = await getAuthContext(request);
  if (!profile) throw new ApiError(403, 'Profil user belum terdaftar.');
  return { authUser, profile };
}

export function requireRole(profile, roles = []) {
  if (!roles.includes(profile.role)) {
    throw new ApiError(403, `Akses ditolak. Role diizinkan: ${roles.join(', ')}`);
  }
}

export function requireActiveAccount(profile) {
  if (!profile.is_active) {
    throw new ApiError(403, 'Akun belum aktif. Menunggu persetujuan admin.');
  }
}

export function requireStudentApproved(profile) {
  if (profile.role !== 'student') return;
  if (!profile.is_student_verified) {
    throw new ApiError(403, 'Akun mahasiswa belum terverifikasi KTM oleh admin.');
  }
}

export function requireAdmin(profile) {
  requireRole(profile, ['admin']);
  requireActiveAccount(profile);
}