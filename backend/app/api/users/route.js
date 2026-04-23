import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { isNonEmptyString, isBoolean } from '@/utils/validators';

const USER_ROLES = ['student', 'client'];

function parsePositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const role = searchParams.get('role');
    const verified = searchParams.get('verified');
    const q = searchParams.get('q')?.trim() || '';
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = Math.min(parsePositiveInt(searchParams.get('limit'), 10), 100);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('users')
      .select(
        'id, email, full_name, role, ktm_image_url, is_student_verified, created_at',
        { count: 'exact' }
      )
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

    if (verified !== null) {
      if (verified !== 'true' && verified !== 'false') {
        return NextResponse.json(
          { message: 'verified harus bernilai true atau false.' },
          { status: 400 }
        );
      }
      query = query.eq('is_student_verified', verified === 'true');
    }

    if (q) {
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      return NextResponse.json(
        { message: 'Gagal mengambil data users', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Berhasil mengambil data users',
        data,
        meta: {
          page,
          limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / limit),
        },
      },
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
      return NextResponse.json({ message: 'email wajib valid.' }, { status: 400 });
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