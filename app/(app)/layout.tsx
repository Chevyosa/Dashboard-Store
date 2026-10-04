import { verifySession } from "@/lib/auth";
import { LogoutButton } from "@/components/layout/logout-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifySession();

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900">
      {/* Top navigation header with IBM precision & Claude Orange accent */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-xs">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="h-4 w-1.5 bg-[#D97757]" />
            <div className="flex items-baseline gap-2">
              <span className="font-bold tracking-tight text-sm text-zinc-900 font-sans">
                Febriyann Store
              </span>
              <span className="hidden sm:inline font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-mono">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>{user.username}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
