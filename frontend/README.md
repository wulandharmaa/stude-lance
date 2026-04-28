# StudeLance Frontend

Frontend StudeLance dibangun dengan **Next.js (TypeScript)**, **Tailwind CSS**, dan **shadcn/ui**.

## Scope Frontend

- Landing page & auth flow (login/register/reset)
- Dashboard role-based (admin, client, student)
- Project board, detail project, apply flow
- Calendar UI untuk jadwal akademik/proyek
- Profile management (termasuk avatar)
- KTM verification upload/status
- Milestone/payment simulation UI
- Chat/project collaboration UI

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query

## Menjalankan Frontend (Local)

1. Install dependencies
2. Siapkan `.env.local`
3. Jalankan dev server

```bash
cd frontend
npm install
npm run dev
```

Default URL: `http://localhost:3000`

## Environment Variables (Frontend)

Contoh minimum:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Struktur Utama Frontend

```text
frontend/
  app/
    (protected)/
      dashboard/
      projects/
      calendar/
      billing/
      profile/
    login/
    register/
  components/
    layout/
    ui/
    ktm/
  utils/
  types/
```

## Catatan

- UI mengikuti referensi desain pada folder `stitch_studelance_ui_ux_architecture_blueprint`.
- Semua request data utama diarahkan ke backend BFF.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
