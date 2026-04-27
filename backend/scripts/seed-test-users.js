const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Muat variabel environment
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local");
  process.exit(1);
}

// Gunakan Service Role Key untuk bypass Auth Rules
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// HANYA CLIENT DAN STUDENT
const testUsers = [
  {
    email: 'client@studelance.com',
    password: 'password123',
    full_name: 'Bapak Client',
    role: 'client',
    is_student_verified: false,
  },
  {
    email: 'student@studelance.com',
    password: 'password123',
    full_name: 'Mahasiswa Rajin',
    role: 'student',
    is_student_verified: false,
  }
];

async function seedUsers() {
  console.log("🚀 Memulai pembuatan akun Client dan Student...\n");

  for (const u of testUsers) {
    // 1. Buat user di Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`⚠️ User ${u.email} sudah ada, melewati...`);
        continue;
      }
      console.error(`❌ Gagal membuat auth user ${u.email}:`, authError.message);
      continue;
    }

    const userId = authData.user.id;
    console.log(`✅ Auth terbuat: ${u.email} (ID: ${userId})`);

    // 2. Update role di tabel public.users
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        role: u.role,
        full_name: u.full_name,
        is_student_verified: u.is_student_verified,
        account_status: u.role === 'client' ? 'approved' : 'pending'
      })
      .eq('id', userId);

    if (updateError) {
      console.error(`❌ Gagal update role untuk ${u.email}:`, updateError.message);
    } else {
      console.log(`✅ Role [${u.role}] berhasil disematkan untuk ${u.email}\n`);
    }
  }

  console.log("🎉 Seeding selesai! Kamu sekarang memiliki aktor Client dan Student untuk testing.");
}

seedUsers();