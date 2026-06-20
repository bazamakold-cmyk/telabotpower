"use client";

import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

export function LockdownOverlay({ seconds = 900 }: { seconds?: number }) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s <= 1 ? 0 : s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");

  return (
    <div className="absolute inset-0 z-50 grid place-items-center rounded-2xl bg-danger/15 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-xl border border-danger/40 bg-background/85 p-6 text-center">
        <Lock className="size-8 text-danger" aria-hidden />
        <p className="font-display font-semibold text-danger">ระบบถูกล็อกชั่วคราว</p>
        <p className="text-sm text-muted-foreground">กดรหัสผิดหลายครั้ง กรุณารอสักครู่</p>
        <p className="font-mono text-3xl font-bold tabular-nums text-danger">
          {mm}:{ss}
        </p>
      </div>
    </div>
  );
}
