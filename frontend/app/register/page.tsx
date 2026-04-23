"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"student" | "client">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Registrasi berhasil. Silakan login.");
    setTimeout(() => router.push("/login"), 1000);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader><CardTitle>Register</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input placeholder="Nama lengkap" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={role}
              onChange={(e) => setRole(e.target.value as "student" | "client")}
            >
              <option value="student">Student</option>
              <option value="client">Client</option>
            </select>
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Memproses..." : "Daftar"}
            </Button>
            {message && <p className="text-sm">{message}</p>}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}