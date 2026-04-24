import Link from "next/link";
import { BadgeCheck, BriefcaseBusiness, ShieldCheck, Workflow } from "lucide-react";
import LandingMenu from "@/components/layout/LandingMenu";
import LandingSupport from "@/components/layout/LandingSupport";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Akun Mahasiswa Terverifikasi",
    description: "Verifikasi KTM dan approval admin sebelum mahasiswa aktif mengambil project.",
    icon: ShieldCheck,
  },
  {
    title: "Project Matching Cepat",
    description: "Client bisa membuka project, memilih student, dan memantau progress dengan jelas.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Workflow Milestone",
    description: "Setiap project dipecah menjadi milestone agar scope dan pembayaran lebih aman.",
    icon: Workflow,
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <LandingMenu />

      <main>
        <section id="tentang" className="accent-radial mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary">
              <BadgeCheck className="size-4" />
              Freelance platform khusus mahasiswa Indonesia
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
              Bangun pengalaman kerja nyata sejak masa kuliah
            </h1>
            <p className="text-muted-foreground sm:text-lg">
              StudeLance menghubungkan client dan mahasiswa terverifikasi untuk kolaborasi project yang aman,
              terstruktur, dan transparan.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg">Daftar Sekarang</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="lg">
                  Masuk ke Dashboard
                </Button>
              </Link>
            </div>
          </div>

          <Card className="accent-glow border-primary/40 bg-gradient-to-br from-primary/15 via-card to-card">
            <CardHeader>
              <CardTitle className="text-primary">Ringkasan Alur StudeLance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p><span className="font-semibold text-primary">1.</span> Student daftar akun dan unggah KTM.</p>
              <p><span className="font-semibold text-primary">2.</span> Admin review dan approve verifikasi.</p>
              <p><span className="font-semibold text-primary">3.</span> Client membuat project dan milestone.</p>
              <p><span className="font-semibold text-primary">4.</span> Kolaborasi berjalan dengan status progress yang jelas.</p>
            </CardContent>
          </Card>
        </section>

        <section id="fitur" className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold sm:text-3xl">Fitur Utama</h2>
            <p className="mt-2 text-sm text-muted-foreground">Didesain agar fitur penting terlihat menonjol dan mudah dipahami.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((item, index) => (
              <Card key={item.title} className="accent-glow border-primary/30 transition-all hover:-translate-y-1 hover:border-primary/60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/15 p-1 text-primary">
                      <item.icon className="size-5" />
                    </span>
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-3 text-xs font-medium text-primary">Highlight #{index + 1}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="cara-kerja" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle>Cara Kerja Singkat</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm text-muted-foreground md:grid-cols-3">
              <p>
                <span className="font-medium text-foreground">Student:</span> registrasi, verifikasi, lalu ambil
                project.
              </p>
              <p>
                <span className="font-medium text-foreground">Client:</span> buat project, tentukan milestone,
                pantau progres.
              </p>
              <p>
                <span className="font-medium text-foreground">Admin:</span> moderasi verifikasi dan audit aktivitas
                penting.
              </p>
            </CardContent>
          </Card>
        </section>

        <LandingSupport />
      </main>
    </div>
  );
}
