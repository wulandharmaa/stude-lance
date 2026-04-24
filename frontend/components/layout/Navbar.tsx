"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Plus } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/types/project";

type Props = {
  profile: UserProfile;
};

export default function Navbar({ profile }: Props) {
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/75 backdrop-blur">
      <div className="page-shell flex h-20 items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">Academic Professionalism</p>
          <h1 className="text-2xl font-bold text-slate-900">StudeLance Workspace</h1>
        </div>

        <div className="flex items-center gap-3">
          {profile.role === "client" ? (
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/projects/create">
                <Plus className="size-4" />
                New Project
              </Link>
            </Button>
          ) : null}
          <Button variant="outline" size="icon-sm" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
          <div className="hidden rounded-2xl border border-[#d7e2d2] bg-[#f8fbf6] px-4 py-2 text-right sm:block">
            <p className="text-sm font-semibold text-slate-900">{profile.full_name}</p>
            <p className="text-xs capitalize text-slate-500">{profile.role}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="size-4" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
