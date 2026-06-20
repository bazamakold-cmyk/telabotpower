"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2"
      aria-label="สลับธีมสว่าง / มืด"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <span className="size-2 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
      <span className="hidden font-medium tracking-wide dark:inline">DARK</span>
      <span className="font-medium tracking-wide dark:hidden">LIGHT</span>
    </Button>
  );
}
