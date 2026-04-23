import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { isValidUuid } from '@/utils/validators';
import { requireAuth, requireRole } from '@/utils/authorization';
import { ApiError } from '@/utils/apiError';
import { assertProjectClient } from '@/utils/accessControl';

const PROJECT_STATUS = ['open', 'in_progress', 'completed'];

export async function PATCH(request, { params }) {
  try {
    const { authUser, profile } = await requireAuth(request);
    requireRole(profile, ['client']);

    const { id } = params;
    const body = await request.json();
    const { status } = body || {};

    if (!isValidUuid(id)) {
      return NextResponse.json({ message: 'id project wajib UUID yang valid.' }, { status: 400 });
    }

    if (!PROJECT_STATUS.includes(status)) {
      return NextResponse.json(
        { message: `status harus salah satu: ${PROJECT_STATUS.join(', ')}` },
        { status: 400 }
      );
    }

    await assertProjectClient(id, authUser.id);

    const { data, error } = await supabase
      .from('projects')
      .update({ status })
      .eq('id', id)
      .select('id, client_id, student_id, title, status, created_at')
      .single();

    if (error) {
      return NextResponse.json({ message: 'Gagal mengubah status project', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Status project berhasil diperbarui', data }, { status: 200 });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Terjadi kesalahan server', error: err.message }, { status: 500 });
  }
}