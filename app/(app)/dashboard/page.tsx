import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Febriyann Store",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 font-sans">
          Dashboard
        </h1>
        <p className="text-xs text-zinc-500">
          Ringkasan omset dan status warung terkini.
        </p>
      </div>

      <div className="rounded border border-zinc-200 bg-white p-8 text-center space-y-3">
        <div className="inline-flex size-10 items-center justify-center rounded-full bg-[#FDF6F3] text-[#D97757]">
          <span className="font-mono text-sm font-bold">✓</span>
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-zinc-800">
            Sesi Berhasil Terhubung
          </h2>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Autentikasi aktif. Fitur manajemen produk, penitip, dan opname akan
            dibuka pada tiket berikutnya.
          </p>
        </div>
      </div>
    </div>
  );
}
