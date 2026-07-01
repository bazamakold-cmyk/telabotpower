"use client";

import { Delete } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_ATTEMPTS = 3;

function KeypadButton({ children, ...rest }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      {...rest}
      className="grid size-16 place-items-center rounded-2xl border border-border bg-card/40 font-display text-xl font-semibold backdrop-blur transition-all hover:border-primary hover:shadow-[0_0_18px_-2px_var(--primary)] active:scale-95"
    >
      {children}
    </button>
  );
}

export function PinKeypad({ onLock }: { onLock: () => void }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);

  async function submit(value: string) {
    const res = await fetch("/api/auth/pin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin: value }),
    });
    if (res.ok) {
      toast.success("เข้าสู่ระบบสำเร็จ");
      router.push("/");
      router.refresh();
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setPin("");
    if (next >= MAX_ATTEMPTS) onLock();
    else toast.error(`PIN ไม่ถูกต้อง (เหลือ ${MAX_ATTEMPTS - next} ครั้ง)`);
  }

  function press(d: string) {
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 6) setTimeout(() => submit(next), 150);
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "size-3.5 rounded-full border transition-colors",
              i < pin.length ? "border-primary bg-primary" : "border-muted-foreground/40"
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <KeypadButton key={d} onClick={() => press(d)}>
            {d}
          </KeypadButton>
        ))}
        <span />
        <KeypadButton onClick={() => press("0")}>0</KeypadButton>
        <KeypadButton onClick={() => setPin((p) => p.slice(0, -1))} aria-label="ลบ">
          <Delete className="size-5" />
        </KeypadButton>
      </div>
    </div>
  );
}
