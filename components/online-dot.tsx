import { cn } from "@/lib/utils";

export function OnlineDot({ online, label }: { online: boolean; label?: string }) {
  const text = label ?? (online ? "ออนไลน์" : "ออฟไลน์");
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="relative flex size-2.5" aria-hidden>
        {online && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/70" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2.5 rounded-full",
            online ? "bg-success" : "bg-muted-foreground/50"
          )}
        />
      </span>
      <span className={online ? "text-success" : "text-muted-foreground"}>{text}</span>
    </span>
  );
}
