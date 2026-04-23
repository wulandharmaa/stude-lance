"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <header className="h-14 border-b bg-white px-4 flex items-center justify-between">
      <h1 className="font-semibold">StudeLance</h1>
      <Button variant="outline" onClick={logout}>
        Logout
      </Button>
    </header>
  );
}