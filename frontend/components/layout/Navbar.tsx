"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Sidebar from "./Sidebar";
import { toast } from "sonner";

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession();
      setEmail(data.session?.user.email ?? "");
    };

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user.email ?? "");
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout berhasil.");
    router.push("/login");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={<Button variant="outline" size="sm" className="md:hidden" aria-label="Open menu" />}
          >
            ☰
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SheetHeader className="px-4 pt-4">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-2">
              <Sidebar onNavigate={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <h1 className="font-semibold">StudeLance</h1>
      </div>

      <div className="flex items-center gap-2">
        {email ? <p className="hidden text-xs text-muted-foreground sm:block">{email}</p> : null}
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}