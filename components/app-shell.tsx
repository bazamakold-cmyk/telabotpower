"use client";

import { Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav, secondaryNav, type NavItem } from "@/components/nav-config";
import { SimulateConcurrent } from "@/components/simulate-concurrent";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

function matchActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-primary/15 px-1.5 text-[11px] font-bold text-primary">
      {count}
    </span>
  );
}

function SidebarLink({ item, active, badge }: { item: NavItem; active: boolean; badge?: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span>{item.label}</span>
      {badge ? <CountBadge count={badge} /> : null}
    </Link>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="grid size-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_16px_-4px_var(--primary)]">
        <Shield className="size-5" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-lg font-bold tracking-wide">TELABOTPOWER</span>
        <span className="block text-[10px] font-medium tracking-[0.2em] text-muted-foreground">
          TELEGRAM OPS CONSOLE
        </span>
      </span>
    </Link>
  );
}

export function AppShell({
  children,
  ticketBadge,
}: {
  children: React.ReactNode;
  ticketBadge?: number;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r p-4 lg:flex">
        <div className="mb-6 px-1">
          <Brand />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {primaryNav.map((item) => (
            <SidebarLink
              key={item.href}
              item={item}
              active={matchActive(pathname, item.href)}
              badge={item.href === "/tickets" ? ticketBadge : undefined}
            />
          ))}
          <div className="my-2 border-t" />
          {secondaryNav.map((item) => (
            <SidebarLink key={item.href} item={item} active={matchActive(pathname, item.href)} />
          ))}
        </nav>
      </aside>

      <div className="lg:pl-64">
        {/* Top header */}
        <header className="glass sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-4 py-3">
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 lg:hidden">
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                const active = matchActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-lg p-2",
                      active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="size-5" />
                  </Link>
                );
              })}
            </div>
            <SimulateConcurrent />
            <ThemeToggle />
          </div>
        </header>

        <div className="px-4 pb-24 pt-4 lg:px-8 lg:pb-8 lg:pt-6">{children}</div>
      </div>

      {/* Mobile bottom nav */}
      <nav className="glass fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t pb-[env(safe-area-inset-bottom)] lg:hidden">
        {primaryNav.map((item) => {
          const Icon = item.icon;
          const active = matchActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-[11px] font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
