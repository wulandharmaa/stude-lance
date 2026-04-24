"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const menuItems = [
  { label: "Tentang", href: "#tentang" },
  { label: "Fitur", href: "#fitur" },
  { label: "Cara Kerja", href: "#cara-kerja" },
  { label: "Bantuan", href: "#bantuan" },
] as const;

export default function LandingMenu() {
  const desktopMenu = useMemo(
    () =>
      menuItems.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          {item.label}
        </a>
      )),
    []
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-primary">
          StudeLance
        </Link>

        <nav className="hidden items-center gap-8 md:flex">{desktopMenu}</nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login">
            <Button variant="ghost">Masuk</Button>
          </Link>
          <Link href="/register">
            <Button>Mulai</Button>
          </Link>
        </div>

        <div className="md:hidden">
          <Sheet>
            <SheetTrigger render={<Button variant="outline" size="icon-sm" aria-label="Open menu" />}>
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px]">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="space-y-2 px-4 pb-4">
                {menuItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-muted"
                  >
                    {item.label}
                  </a>
                ))}
                <div className="grid gap-2 pt-2">
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      Masuk
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full">Daftar</Button>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
