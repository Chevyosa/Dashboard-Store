import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk — Febriyann Store",
  description: "Masuk ke dashboard internal toko Febriyann Store",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-white selection:bg-[#D97757]/20 selection:text-[#D97757]">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand header with Claude Orange accent & IBM vibes */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-8 bg-[#D97757] rounded-none inline-block" />
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
              Internal // Febriyann Store
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 font-sans">
              Masuk Dashboard
            </h1>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Sistem pencatatan omset, profit opname, dan titipan.
            </p>
          </div>
        </div>

        {/* Login form container */}
        <div className="border border-zinc-200 bg-white p-6 shadow-xs">
          <Suspense
            fallback={<div className="h-48 animate-pulse bg-zinc-50" />}
          >
            <LoginForm />
          </Suspense>
        </div>

        {/* Footer info */}
        <div className="text-center font-mono text-[11px] text-zinc-400">
          <span>Khusus akses internal toko &bull; Asia/Jakarta</span>
        </div>
      </div>
    </main>
  );
}
