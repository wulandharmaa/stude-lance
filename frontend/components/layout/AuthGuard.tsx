"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabaseClient";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
        setAllowed(false);
      } else {
        setAllowed(true);
      }
      setChecking(false);
    };
    check();
  }, [router]);

  if (checking) return <p className="p-6">Checking session...</p>;
  if (!allowed) return null;

  return <>{children}</>;
}