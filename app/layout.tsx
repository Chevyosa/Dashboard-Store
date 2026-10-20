import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Febriyann Store",
  description: "Dashboard internal toko Febriyann Store",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={cn(
        "h-full antialiased",
        ibmPlexSans.variable,
        ibmPlexMono.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900 selection:bg-[#D97757]/20 selection:text-[#D97757]">
        {children}
      </body>
    </html>
  );
}
