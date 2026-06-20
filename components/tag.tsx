import type { LucideIcon } from "lucide-react";
import type { Token } from "@/lib/tags";
import { cn } from "@/lib/utils";

const tokenClasses: Record<Token, string> = {
  danger: "text-danger border-danger/30 bg-danger/10",
  warn: "text-warn border-warn/30 bg-warn/10",
  info: "text-info border-info/30 bg-info/10",
  working: "text-working border-working/30 bg-working/10",
  success: "text-success border-success/30 bg-success/10",
};

export function Tag({ token, icon: Icon, label }: { token: Token; icon: LucideIcon; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        tokenClasses[token]
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}
