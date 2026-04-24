"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "client">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, role } },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    toast.success("Registrasi berhasil. Silakan login.");
    setTimeout(() => router.push("/login"), 800);
  };

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Daftar Akun</CardTitle>
          <p className="text-sm text-muted-foreground">Buat akun student atau client.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input placeholder="Nama lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={role} onChange={(e) => setRole(e.target.value as "student" | "client")}>
              <option value="student">Student</option>
              <option value="client">Client</option>
            </select>
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Daftar"}
            </Button>

            <p className="text-sm">
              Sudah punya akun? <Link href="/login" className="underline">Login</Link>
            </p>
            <p className="text-center text-xs text-muted-foreground">
              Kembali ke <Link href="/" className="underline">landing page</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}