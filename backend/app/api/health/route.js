import supabase from '@/utils/supabaseClient';
import { success, error } from '@/utils/apiResponse';

export async function GET() {
  try {
    const { error: dbError } = await supabase.from('users').select('id').limit(1);

    if (dbError) return error('Health check gagal', 500, dbError.message);

    return success('Backend sehat', {
      service: 'stude-lance-backend',
      db: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return error('Health check gagal', 500, err.message);
  }
}