import Link from "next/link";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySession } from "@/lib/auth/auth";
import LogoutButton from "./LogoutButton";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/tools", label: "Tools" },
  { href: "/dashboard/upload", label: "Upload" },
  { href: "/dashboard/categories", label: "Categories" },
  { href: "/dashboard/files", label: "Files" },
  { href: "/dashboard/downloads", label: "Downloads" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/activity", label: "Activity" },
  { href: "/dashboard/maintenance", label: "Maintenance" },
  { href: "/dashboard/settings", label: "Settings" },
  { href: "/dashboard/database", label: "Database" },
  { href: "/dashboard/backup", label: "Backup" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySession(token) : null;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 grid md:grid-cols-[220px_1fr] gap-8">
      <aside>
        <div className="mb-6">
          <p className="text-xs text-zinc-500">Logged in as</p>
          <p className="font-medium">{session?.username || "owner"}</p>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg hover:bg-zinc-900 text-zinc-300 hover:text-white transition"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </aside>
      <div>{children}</div>
    </div>
  );
}
