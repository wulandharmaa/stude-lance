import { NextResponse } from 'next/server';
import supabase from '@/utils/supabaseClient';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        id,
        client_id,
        student_id,
        title,
        status,
        milestones (
          id,
          project_id,
          title,
          amount,
          due_date,
          status
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { message: 'Gagal mengambil data projects', error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Berhasil mengambil data projects', data },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: 'Terjadi kesalahan server', error: err.message },
      { status: 500 }
    );
  }
}