import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type KpiDelta = { label: string; tone: "good" | "bad"; dir: "up" | "down" };

export function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  delta,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  delta?: KpiDelta;
}) {
  return (
    <div className="glass relative overflow-hidden rounded-xl p-4">
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="flex items-start justify-between">
        <span className="grid size-10 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs font-medium",
              delta.tone === "good"
                ? "border-success/30 bg-success/10 text-success"
                : "border-danger/30 bg-danger/10 text-danger"
            )}
          >
            {delta.dir === "up" ? (
              <ArrowUpRight className="size-3" aria-hidden />
            ) : (
              <ArrowDownRight className="size-3" aria-hidden />
            )}
            {delta.label}
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-3xl font-bold tabular-nums">
        {value}
        {unit && <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span>}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
