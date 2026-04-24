import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarDays, MessagesSquare, ShieldCheck, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: ShieldCheck,
    title: "Manual KTM Verification",
    description: "Mahasiswa diverifikasi admin lebih dulu agar klien bekerja dengan talenta yang lebih kredibel.",
  },
  {
    icon: CalendarDays,
    title: "Academic-Sync Calendar",
    description: "Kelas, ujian, dan deadline proyek tampil dalam satu ritme kerja yang realistis.",
  },
  {
    icon: WalletCards,
    title: "Micro-Milestone Payment",
    description: "Pembayaran simulasi dipecah per milestone agar progres dan fee tetap transparan.",
  },
  {
    icon: MessagesSquare,
    title: "Project Collaboration Hub",
    description: "Overview, chat, file, dan approval proyek dikunci dalam satu workspace profesional.",
  },
];

export default function Home() {
  return (
    <main className="pb-20">
      <section className="hero-grid border-b border-white/70">
        <div className="page-shell py-6">
          <header className="glass-panel flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">Academic Professionalism</p>
              <h1 className="text-2xl font-bold text-slate-900">StudeLance</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost">
                <Link href="/login">Masuk</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Mulai</Link>
              </Button>
            </div>
          </header>

          <div className="grid gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:py-20">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white/70 px-4 py-2 text-sm font-medium text-primary shadow-sm">
                <BadgeCheck className="size-4" />
                Marketplace freelance khusus mahasiswa Indonesia
              </div>
              <div className="space-y-5">
                <h2 className="max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight text-slate-950 sm:text-6xl">
                  Kerja fleksibel untuk mahasiswa, dengan ritme yang aman buat kuliah dan klien.
                </h2>
                <p className="max-w-2xl text-lg leading-8 text-slate-600">
                  StudeLance menggabungkan verifikasi KTM, kalender akademik, workspace proyek, dan micro-milestone
                  payment agar pengalaman freelance terasa lebih terpercaya sejak project pertama.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/register">
                    Daftar Sekarang
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Lihat Workspace</Link>
                </Button>
              </div>
            </div>

            <div className="glass-panel overflow-hidden p-6">
              <div className="rounded-[24px] bg-[#f4f8f0] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/70">Core Flow</p>
                <div className="mt-5 space-y-4">
                  {[
                    "Student daftar, lengkapi profil, lalu unggah KTM.",
                    "Admin meninjau verifikasi dan membuka akses apply project.",
                    "Client posting project, review proposal, dan tetapkan milestone.",
                    "Kolaborasi berjalan lewat overview, chat, file, calendar, dan billing.",
                  ].map((item, index) => (
                    <div key={item} className="flex gap-4 rounded-2xl bg-white px-4 py-4 shadow-sm">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="page-shell py-16">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Built for Trust</p>
          <h3 className="mt-3 text-4xl font-bold text-slate-950">Semua fitur penting dari PRD hadir di alur inti.</h3>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.title} className="rounded-[28px] border-white/70 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
              <CardHeader>
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#edf6e8] text-primary">
                  <feature.icon className="size-5" />
                </div>
                <CardTitle className="pt-4 text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-slate-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
