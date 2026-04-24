"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: "",
    role: "student",
    email: "",
    password: "",
    city: "",
    university_name: "",
    major: "",
  });
  const [loading, setLoading] = useState(false);

  const onChange = (field: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          role: form.role,
          city: form.city,
          university_name: form.university_name,
          major: form.major,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success(
      form.role === "student"
        ? "Akun mahasiswa dibuat. Login lalu unggah KTM untuk aktivasi penuh."
        : "Akun klien berhasil dibuat."
    );
    router.push("/login");
  };

  return (
    <main className="page-shell grid min-h-screen items-center py-10 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="hidden pr-12 lg:block">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Registration</p>
        <h1 className="mt-4 text-5xl font-extrabold leading-tight text-slate-950">
          Mulai dari akun yang sesuai, lalu bangun reputasi di kota target Anda.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
          Mahasiswa akan diarahkan ke alur verifikasi KTM, sedangkan klien bisa langsung membuka proyek dan menerima
          proposal.
        </p>
      </div>

      <Card className="glass-panel mx-auto w-full max-w-2xl border-white/70">
        <CardContent className="grid gap-8 p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Create Account</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">Daftar ke StudeLance</h2>
            <p className="mt-2 text-sm text-slate-600">Lengkapi identitas dasar agar profil publik dan approval flow siap digunakan.</p>
          </div>

          <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
            <Input
              className="md:col-span-2"
              placeholder="Nama lengkap"
              value={form.full_name}
              onChange={(e) => onChange("full_name", e.target.value)}
              required
            />
            <select
              className="h-11 rounded-xl border border-input bg-white px-3 text-sm text-slate-700"
              value={form.role}
              onChange={(e) => onChange("role", e.target.value)}
            >
              <option value="student">Student</option>
              <option value="client">Client</option>
            </select>
            <Input placeholder="Kota" value={form.city} onChange={(e) => onChange("city", e.target.value)} required />
            <Input
              className="md:col-span-2"
              placeholder={form.role === "student" ? "Universitas" : "Organisasi / Perusahaan"}
              value={form.university_name}
              onChange={(e) => onChange("university_name", e.target.value)}
            />
            <Input
              placeholder={form.role === "student" ? "Jurusan" : "Bidang"}
              value={form.major}
              onChange={(e) => onChange("major", e.target.value)}
            />
            <Input type="email" placeholder="Email" value={form.email} onChange={(e) => onChange("email", e.target.value)} required />
            <Input
              className="md:col-span-2"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => onChange("password", e.target.value)}
              required
            />
            <Button type="submit" className="md:col-span-2" size="lg" disabled={loading}>
              {loading ? "Membuat akun..." : "Buat Akun"}
            </Button>
          </form>

          <p className="text-sm text-slate-600">
            Sudah punya akun?{" "}
            <Link href="/login" className="underline decoration-primary/50 underline-offset-4">
              Masuk di sini
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
