/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  });
}

function getArg(name, fallback = '') {
  const prefix = `--${name}=`;
  const exact = process.argv.find((a) => a.startsWith(prefix));
  if (exact) return exact.slice(prefix.length);
  return fallback;
}

async function main() {
  const scriptDir = __dirname;
  const backendEnv = path.resolve(scriptDir, '..', '.env.local');
  const rootEnv = path.resolve(scriptDir, '..', '..', '.env.local');
  loadEnvFile(backendEnv);
  loadEnvFile(rootEnv);

  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum terisi.');
  }

  const adminEmail = getArg('email', 'admin@studelance.local');
  const adminPassword = getArg('password', 'Admin12345!');
  const adminName = getArg('name', 'StudeLance Admin');

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let userId = null;

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
    user_metadata: { full_name: adminName, role: 'admin' },
  });

  if (createErr) {
    if (String(createErr.message || '').toLowerCase().includes('already registered')) {
      const { data: existing, error: existErr } = await supabase
        .from('users')
        .select('id')
        .eq('email', adminEmail)
        .maybeSingle();

      if (existErr || !existing?.id) {
        throw new Error(`Admin sudah terdaftar di Auth, tapi tidak ditemukan di public.users: ${existErr?.message || 'not found'}`);
      }
      userId = existing.id;
      console.log('[INFO] Admin auth user sudah ada, lanjut sinkronisasi profile.');
    } else {
      throw createErr;
    }
  } else {
    userId = created.user.id;
    console.log(`[OK] Admin auth user dibuat: ${adminEmail}`);
  }

  const now = new Date().toISOString();

  const { error: upsertErr } = await supabase.from('users').upsert(
    {
      id: userId,
      email: adminEmail,
      full_name: adminName,
      role: 'admin',
      email_verified_at: now,
      is_active: true,
      account_status: 'approved',
      account_rejection_reason: null,
      approved_by: userId,
      approved_at: now,
      is_student_verified: false,
    },
    { onConflict: 'id' }
  );

  if (upsertErr) throw upsertErr;

  console.log('[OK] public.users sinkron sebagai admin aktif.');
  console.log(`[DONE] Email: ${adminEmail}`);
}

main().catch((err) => {
  console.error('[FAIL]', err.message || err);
  process.exit(1);
});