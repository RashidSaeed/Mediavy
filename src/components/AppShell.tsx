"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Activity } from "lucide-react";
import { NAV_ITEMS } from "@/components/nav-items";

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col border-r border-border-hairline bg-surface">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--series-1)] text-white">
            <Activity className="h-4.5 w-4.5" strokeWidth={2.5} />
          </span>
          <div>
            <p className="text-sm font-semibold leading-none text-text-primary">Mediavy</p>
            <p className="mt-1 text-xs leading-none text-text-muted">Field Force Dashboard</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-[color-mix(in_oklab,var(--series-1)_14%,transparent)] text-[var(--series-1)]"
                    : "text-text-secondary hover:bg-[color-mix(in_oklab,var(--text-primary)_5%,transparent)] hover:text-text-primary"
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border-hairline px-5 py-4 text-xs text-text-muted">
          Sample dataset · trailing 6 months
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center gap-2 border-b border-border-hairline bg-surface px-4 py-3 md:hidden">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--series-1)] text-white">
            <Activity className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <p className="text-sm font-semibold text-text-primary">Mediavy</p>
        </header>

        <main className="flex-1 pb-20 md:pb-0">{children}</main>

        {/* Mobile bottom tab bar */}
        <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border-hairline bg-surface/95 backdrop-blur md:hidden">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  active ? "text-[var(--series-1)]" : "text-text-muted"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {item.shortLabel}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
