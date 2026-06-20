"use client";

import { Bot } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { primaryNav, secondaryNav, type NavItem } from "@/components/nav-config";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

function matchActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r p-4 lg:flex">
        <Link href="/" className="mb-6 flex items-center gap-2 px-2 font-display text-lg font-bold">
          <Bot className="size-6 text-primary" />
          <span>Telabotpower</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {primaryNav.map((item) => (
            <SidebarLink key={item.href} item={item} active={matchActive(pathname, item.href)} />
          ))}
          <div className="my-2 border-t" />
          {secondaryNav.map((item) => (
            <SidebarLink key={item.href} item={item} active={matchActive(pathname, item.href)} />
          ))}
        </nav>
        <div className="flex items-center justify-between border-t pt-3">
          <span className="text-xs text-muted-foreground">โหมดธีม</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="glass sticky top-0 z-30 flex items-center justify-between border-b px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2 font-display font-bold">
          <Bot className="size-5 text-primary" />
          Telabotpower
        </Link>
        <div className="flex items-center gap-1">
          {secondaryNav.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className="rounded-lg p-2 text-muted-foreground hover:text-foreground"
              >
                <Icon className="size-5" />
              </Link>
            );
          })}
          <ThemeToggle />
        </div>
      </header>

      {/* Content */}
      <div className="px-4 pb-24 pt-4 lg:pb-8 lg:pl-72 lg:pr-8 lg:pt-8">{children}</div>

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
