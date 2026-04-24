import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const supports = [
  {
    title: "Verifikasi Mahasiswa",
    description:
      "Proses verifikasi KTM oleh admin untuk menjaga kualitas freelancer mahasiswa di platform.",
  },
  {
    title: "Escrow Milestone",
    description:
      "Pembayaran berbasis milestone agar pengerjaan lebih aman dan transparan untuk client maupun student.",
  },
  {
    title: "Monitoring Progress",
    description:
      "Dashboard proyek, jadwal, dan chat agar komunikasi kerja lebih rapi dalam satu tempat.",
  },
] as const;

export default function LandingSupport() {
  return (
    <section id="bantuan" className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <p className="mb-2 inline-flex rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          Kenapa StudeLance?
        </p>
        <h2 className="text-2xl font-semibold sm:text-3xl">Platform freelance khusus mahasiswa</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {supports.map((item) => (
          <Card key={item.title} className="accent-glow border-primary/30 transition-all hover:-translate-y-1 hover:border-primary/60">
            <CardHeader>
              <CardTitle className="text-primary">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
