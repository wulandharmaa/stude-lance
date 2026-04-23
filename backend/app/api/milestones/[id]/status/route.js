import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';
import { isValidUuid } from '@/utils/validators';
import { requireAuth } from '@/utils/authorization';
import { ApiError } from '@/utils/apiError';
import { assertMilestoneProjectMember } from '@/utils/accessControl';

const MILESTONE_STATUS = ['pending', 'working', 'approved'];

export async function PATCH(request, { params }) {
  try {
    const { authUser } = await requireAuth(request);

    const { id } = params;
    const body = await request.json();
    const { status } = body || {};

    if (!isValidUuid(id)) {
      return NextResponse.json({ message: 'id milestone wajib UUID yang valid.' }, { status: 400 });
    }

    if (!MILESTONE_STATUS.includes(status)) {
      return NextResponse.json(
        { message: `status harus salah satu: ${MILESTONE_STATUS.join(', ')}` },
        { status: 400 }
      );
    }

    await assertMilestoneProjectMember(id, authUser.id);

    const { data, error } = await supabase
      .from('milestones')
      .update({ status })
      .eq('id', id)
      .select('id, project_id, title, amount, due_date, status, created_at')
      .single();

    if (error) {
      return NextResponse.json({ message: 'Gagal mengubah status milestone', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Status milestone berhasil diperbarui', data }, { status: 200 });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ message: err.message }, { status: err.status });
    }
    return NextResponse.json({ message: 'Terjadi kesalahan server', error: err.message }, { status: 500 });
  }
}