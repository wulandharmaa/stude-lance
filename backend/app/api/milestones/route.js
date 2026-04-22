import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';

const MILESTONE_STATUS = ['pending', 'working', 'approved'];
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

function isValidDate(value) {
  if (!value) return true;
  return !Number.isNaN(Date.parse(value));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');

    if (!isValidUuid(projectId)) {
      return NextResponse.json(
        { message: 'project_id wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('milestones')
      .select('id, project_id, title, amount, due_date, status, created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { message: 'Gagal mengambil data milestones', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Berhasil mengambil data milestones', data },
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
      project_id,
      title,
      amount,
      due_date = null,
      status = 'pending',
    } = body || {};

    if (!isValidUuid(project_id)) {
      return NextResponse.json(
        { message: 'project_id wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return NextResponse.json(
        { message: 'title wajib diisi minimal 3 karakter.' },
        { status: 400 }
      );
    }

    const parsedAmount = Number(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json(
        { message: 'amount wajib angka dan tidak boleh negatif.' },
        { status: 400 }
      );
    }

    if (!isValidDate(due_date)) {
      return NextResponse.json(
        { message: 'due_date harus format tanggal yang valid.' },
        { status: 400 }
      );
    }

    if (!MILESTONE_STATUS.includes(status)) {
      return NextResponse.json(
        { message: `status harus salah satu: ${MILESTONE_STATUS.join(', ')}` },
        { status: 400 }
      );
    }

    const payload = {
      project_id,
      title: title.trim(),
      amount: parsedAmount,
      due_date,
      status,
    };

    const { data, error } = await supabase
      .from('milestones')
      .insert(payload)
      .select('id, project_id, title, amount, due_date, status, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { message: 'Gagal membuat milestone', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Milestone berhasil dibuat', data },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}