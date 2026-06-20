import { OnlineDot } from "@/components/online-dot";
import type { User } from "@/lib/types";

export function AdminLivePanel({ admins, sla }: { admins: User[]; sla: number }) {
  return (
    <div className="glass relative overflow-hidden rounded-xl p-5">
      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-primary">
          LIVE
        </span>
        <h2 className="font-display font-semibold">สถานะแอดมินออนไลน์</h2>
      </div>

      <ul className="divide-y divide-border">
        {admins.map((a) => (
          <li key={a.id} className="flex items-center justify-between py-3">
            <span className="text-sm">
              {a.name}
              {a.telegramId && (
                <span className="ml-1 font-mono text-xs text-muted-foreground">
                  #{a.telegramId.slice(-4)}
                </span>
              )}
            </span>
            <OnlineDot online={a.pinOnline} />
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">เป้าหมาย SLA วันนี้</span>
          <span className="font-display font-bold tabular-nums">{sla}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary shadow-[0_0_10px_var(--primary)]"
            style={{ width: `${sla}%` }}
          />
        </div>
      </div>
    </div>
  );
}
