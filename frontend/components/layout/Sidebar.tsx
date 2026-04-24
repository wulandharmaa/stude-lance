"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, CalendarDays, CreditCard, LayoutDashboard, ShieldCheck, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/project";

type Props = {
  profile: UserProfile;
  onNavigate?: () => void;
};

export default function Sidebar({ profile, onNavigate }: Props) {
  const pathname = usePathname();

  const links =
    profile.role === "admin"
      ? [
          { href: "/dashboard", label: "Admin Dashboard", icon: ShieldCheck },
          { href: "/projects", label: "Projects", icon: BriefcaseBusiness },
          { href: "/profile", label: "Profile", icon: UserRound },
        ]
      : [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/projects", label: profile.role === "client" ? "My Projects" : "Marketplace", icon: BriefcaseBusiness },
          { href: "/calendar", label: "Calendar", icon: CalendarDays },
          { href: "/billing", label: "Billing", icon: CreditCard },
          { href: "/profile", label: "Profile", icon: UserRound },
        ];

  return (
    <aside className="flex h-full flex-col gap-6 bg-white/90 p-5">
      <div className="rounded-3xl bg-[#f2f8ef] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">Workspace</p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">StudeLance</h2>
        <p className="mt-2 text-sm text-slate-600">
          {profile.role === "admin"
            ? "Moderasi verifikasi, pantau aktivitas, dan jaga kualitas ekosistem."
            : profile.role === "client"
              ? "Kelola proyek mahasiswa, milestone, dan pembayaran simulasi."
              : "Atur jadwal akademik, lamar proyek, dan bangun portofolio."}
        </p>
      </div>

      <nav className="space-y-1">
        {links.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-white shadow-[0_12px_32px_rgba(58,115,38,0.28)]"
                  : "text-slate-600 hover:bg-[#f4f7f2] hover:text-slate-900"
              )}
            >
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl border border-[#d7e2d2] bg-[#fbfdf9] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Account Status</p>
        <p className="mt-2 text-base font-semibold capitalize text-slate-900">{profile.account_status}</p>
        <p className="mt-1 text-sm text-slate-600">
          {profile.role === "student" && !profile.is_student_verified
            ? "Lengkapi verifikasi KTM untuk membuka akses apply project."
            : "Akun sudah siap dipakai di workspace."}
        </p>
      </div>
    </aside>
  );
}
