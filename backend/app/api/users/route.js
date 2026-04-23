import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { isNonEmptyString, isBoolean } from '@/utils/validators';

const USER_ROLES = ['student', 'client'];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    let query = supabase
      .from('users')
      .select('id, email, full_name, role, ktm_image_url, is_student_verified, created_at')
      .order('created_at', { ascending: false });

    if (role) {
      if (!USER_ROLES.includes(role)) {
        return NextResponse.json(
          { message: `role harus salah satu: ${USER_ROLES.join(', ')}` },
          { status: 400 }
        );
      }
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { message: 'Gagal mengambil data users', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Berhasil mengambil data users', data },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      full_name,
      role,
      ktm_image_url = null,
      is_student_verified = false,
    } = body || {};

    if (!isNonEmptyString(email, 5) || !email.includes('@')) {
      return NextResponse.json(
        { message: 'email wajib valid.' },
        { status: 400 }
      );
    }

    if (!isNonEmptyString(full_name, 3)) {
      return NextResponse.json(
        { message: 'full_name wajib minimal 3 karakter.' },
        { status: 400 }
      );
    }

    if (!USER_ROLES.includes(role)) {
      return NextResponse.json(
        { message: `role harus salah satu: ${USER_ROLES.join(', ')}` },
        { status: 400 }
      );
    }

    if (ktm_image_url !== null && !isNonEmptyString(ktm_image_url, 8)) {
      return NextResponse.json(
        { message: 'ktm_image_url harus null atau URL string valid.' },
        { status: 400 }
      );
    }

    if (!isBoolean(is_student_verified)) {
      return NextResponse.json(
        { message: 'is_student_verified wajib boolean.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        email: email.trim().toLowerCase(),
        full_name: full_name.trim(),
        role,
        ktm_image_url,
        is_student_verified,
      })
      .select('id, email, full_name, role, ktm_image_url, is_student_verified, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { message: 'Gagal membuat user', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'User berhasil dibuat', data },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}