import { verifySession } from "@/lib/auth";
import { LogoutButton } from "@/components/layout/logout-button";
import { NavLinks } from "@/components/layout/nav-links";
import { BottomNav } from "@/components/layout/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await verifySession();

  return (
    <div className="min-h-screen flex flex-col bg-white text-zinc-900">
      {/* Top navigation header */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-xs">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1.5 bg-[#D97757]" />
              <span className="font-bold tracking-tight text-sm text-zinc-900 font-sans">
                Febriyann Store
              </span>
            </div>
            <NavLinks />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 text-xs text-zinc-600 font-mono">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span className="max-w-[120px] truncate">{user.username}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main content with bottom clearance for mobile navbar */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-3.5 sm:px-6 py-6 pb-28 lg:pb-8">
        {children}
      </main>

      {/* Mobile native-style bottom navigation */}
      <BottomNav username={user.username} />
    </div>
  );
}
