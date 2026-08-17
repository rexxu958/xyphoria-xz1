import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "XYPHORIA — Tools, code and innovation",
  description: "Tools, code and innovation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/90 backdrop-blur z-50">
          <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg tracking-tight">
              XYPHORIA
            </Link>
            <div className="flex items-center gap-6 text-sm text-zinc-400">
              <Link href="/" className="hover:text-white transition">Tools</Link>
              <Link href="/login" className="hover:text-white transition">Owner Login</Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-800 py-8 text-center text-xs text-zinc-500">
          © {new Date().getFullYear()} XYPHORIA — Tools, code and innovation.
        </footer>
      </body>
    </html>
  );
}
