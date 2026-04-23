import supabase from '@/utils/supabaseClient';
import { ok, fail } from '@/utils/apiResponse';

export async function GET() {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);

    if (error) {
      return fail('Health check gagal', 500, error.message);
    }

    return ok(
      'Backend sehat',
      {
        service: 'stude-lance-backend',
        db: 'connected',
        timestamp: new Date().toISOString(),
      },
      null,
      200
    );
  } catch (err) {
    return fail('Health check gagal', 500, err.message);
  }
}