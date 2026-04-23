import { NextResponse } from 'next/server';
import { getAuthContext } from '@/utils/auth';
import { ApiError } from '@/utils/apiError';

export async function GET(request) {
  try {
    const { authUser, profile } = await getAuthContext(request);

    return NextResponse.json(
      {
        message: 'Berhasil mengambil profil auth user',
        data: {
          auth_user: {
            id: authUser.id,
            email: authUser.email,
            created_at: authUser.created_at,
          },
          profile,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }

    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}