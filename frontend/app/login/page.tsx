"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Login berhasil.");
    router.push("/dashboard");
  };

  return (
    <main className="page-shell grid min-h-screen items-center py-10 lg:grid-cols-2">
      <div className="hidden pr-12 lg:block">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Welcome Back</p>
        <h1 className="mt-4 text-5xl font-extrabold leading-tight text-slate-950">
          Masuk ke workspace proyek mahasiswa yang rapi dan terpercaya.
        </h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
          Pantau milestone, diskusi proyek, kalender akademik, dan billing dari satu dashboard yang konsisten dengan
          ritme kuliah maupun kebutuhan klien.
        </p>
      </div>

      <Card className="glass-panel mx-auto w-full max-w-xl overflow-hidden border-white/70">
        <CardContent className="grid gap-8 p-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Login</p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">Akses dashboard StudeLance</h2>
            <p className="mt-2 text-sm text-slate-600">Gunakan akun Supabase Anda untuk masuk ke workspace.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Memproses..." : "Masuk ke Workspace"}
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <Link href="/forgot-password" className="underline decoration-primary/50 underline-offset-4">
              Lupa password?
            </Link>
            <Link href="/register" className="underline decoration-primary/50 underline-offset-4">
              Buat akun baru
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
