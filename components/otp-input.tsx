"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";

export function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(i: number, d: string) {
    const clean = d.replace(/\D/g, "").slice(-1);
    const arr = value.padEnd(6, " ").split("");
    arr[i] = clean || " ";
    onChange(arr.join("").replace(/ /g, "").slice(0, 6));
    if (clean && i < 5) refs.current[i + 1]?.focus();
  }

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ""}
          onChange={(e) => setDigit(i, e.target.value)}
          aria-label={`หลักที่ ${i + 1}`}
          className="size-12 text-center font-mono text-lg"
        />
      ))}
    </div>
  );
}
