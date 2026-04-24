"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard } from "lucide-react";

type Props = {
  onNavigate?: () => void;
};

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/", label: "Landing Page", icon: Home },
];

export default function Sidebar({ onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <aside className="h-[calc(100vh-56px)] w-64 border-r bg-background p-4">
      <p className="mb-3 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Menu</p>
      <div className="space-y-1">
      {links.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              active ? "bg-muted font-medium" : "hover:bg-muted"
            }`}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
      </div>
    </aside>
  );
}