import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Environment variable SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY wajib diisi.'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;