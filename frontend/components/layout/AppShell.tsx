"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { fetchMe } from "@/utils/fetchers";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  if (meQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="glass-panel flex w-full max-w-md flex-col items-center gap-3 p-8 text-center">
          <div className="size-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-slate-600">Menyusun workspace Anda...</p>
        </div>
      </div>
    );
  }

  if (meQuery.isError || !meQuery.data?.profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="glass-panel max-w-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900">Gagal memuat workspace</h2>
          <p className="mt-3 text-sm text-slate-600">
            Kami belum bisa mengambil profil akun dari backend. Coba refresh halaman atau login ulang.
          </p>
        </div>
      </div>
    );
  }

  const profile = meQuery.data.profile;

  return (
    <div className="min-h-screen">
      <Navbar profile={profile} />
      <div className="page-shell flex gap-6 py-6">
        <aside className="hidden w-[280px] shrink-0 overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] md:block">
          <Sidebar profile={profile} />
        </aside>

        <div className="fixed bottom-5 right-5 z-40 md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger render={<Button size="icon-lg" className="rounded-full shadow-[0_20px_40px_rgba(58,115,38,0.35)]" />}>
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] p-0">
              <Sidebar profile={profile} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>

        <main className="flex-1">
          <div className="space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
