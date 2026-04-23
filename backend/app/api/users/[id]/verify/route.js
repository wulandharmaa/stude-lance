import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { isValidUuid } from '@/utils/validators';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { is_student_verified = true } = body || {};

    if (!isValidUuid(id)) {
      return NextResponse.json(
        { message: 'id user wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    if (typeof is_student_verified !== 'boolean') {
      return NextResponse.json(
        { message: 'is_student_verified wajib boolean.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .update({ is_student_verified })
      .eq('id', id)
      .eq('role', 'student')
      .select('id, email, full_name, role, ktm_image_url, is_student_verified, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { message: 'Gagal memperbarui verifikasi student', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Verifikasi student berhasil diperbarui', data },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}