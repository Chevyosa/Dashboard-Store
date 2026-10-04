"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RiLogoutBoxRLine } from "@remixicon/react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await apiFetch("/api/v1/auth/logout", { method: "POST" });
    } catch {
      // Even if network fails, navigate to login
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={loading}
      className="h-8 gap-1.5 border-zinc-200 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-300"
    >
      <RiLogoutBoxRLine className="size-3.5" />
      <span>{loading ? "Keluar..." : "Keluar"}</span>
    </Button>
  );
}
