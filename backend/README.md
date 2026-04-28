# StudeLance Backend

Backend StudeLance dibangun dengan **Next.js API Routes (JavaScript)** dan terhubung ke **Supabase** (Auth, Postgres, Storage).

## Scope Backend

- Authentication & authorization guard
- Role-based access control (admin/client/student)
- KTM verification workflow (student submit, admin approve/reject)
- CRUD proyek, aplikasi proyek, assignment
- Milestone dan simulasi pembayaran
- Schedule/calendar API
- Message/chat API
- Admin moderation & audit trail

## Menjalankan Backend (Local)

```bash
cd backend
npm install
npm run dev
```

Default URL: `http://localhost:3001`

## Environment Variables (Backend)

Contoh minimum:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Migrasi Database (Supabase CLI)

Dari folder `backend`:

```bash
npx supabase db push
```

Jika butuh reset lokal:

```bash
npx supabase db reset
```

## Seed Akun Test

Gunakan script seed untuk menyiapkan akun role `admin`, `student`, `client`:

```bash
node scripts/seed-test-users.js
```

Lalu cek kredensial default pada file/script seed tersebut.

## Struktur Utama Backend

```text
backend/
  app/api/
    admin/
    student/
    projects/
    milestones/
    payments/
    schedules/
    messages/
    profile/
  utils/
    auth.js
    authorization.js
    accessControl.js
    supabaseAdmin.js
  supabase/
    migrations/
    seed.sql
```

## API Highlights

- `POST /api/student/verifications`
- `GET /api/admin/verifications`
- `POST /api/admin/verifications/:id/approve`
- `POST /api/admin/verifications/:id/reject`
- `GET /api/projects`
- `POST /api/projects`
- `POST /api/projects/:id/applications`
- `GET /api/milestones`
- `POST /api/payments/*`
- `GET/POST /api/schedules`
- `GET/POST /api/messages`
