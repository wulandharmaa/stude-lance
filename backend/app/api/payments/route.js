import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const PAYMENT_STATUS = ['pending', 'paid', 'failed', 'refunded'];

function isValidUuid(value) {
  return typeof value === 'string' && UUID_REGEX.test(value);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const milestoneId = searchParams.get('milestone_id');

    if (!isValidUuid(milestoneId)) {
      return NextResponse.json(
        { message: 'milestone_id wajib UUID yang valid.' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        milestone_id,
        amount,
        status,
        created_at,
        milestones (
          id,
          project_id,
          title,
          amount,
          due_date,
          status
        )
      `)
      .eq('milestone_id', milestoneId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { message: 'Gagal mengambil data payments', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Berhasil mengambil data payments', data },
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
    const { milestone_id, amount, status = 'pending' } = body || {};

    if (!isValidUuid(milestone_id)) {
      return NextResponse.json(
        { message: 'milestone_id wajib UUID yang valid.' },
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

    if (!PAYMENT_STATUS.includes(status)) {
      return NextResponse.json(
        { message: `status harus salah satu: ${PAYMENT_STATUS.join(', ')}` },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('payments')
      .insert({
        milestone_id,
        amount: parsedAmount,
        status,
      })
      .select('id, milestone_id, amount, status, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { message: 'Gagal membuat payment', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Payment berhasil dibuat', data },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}