"use client";

import Link from "next/link";
import { useState } from "react";
import { LockdownOverlay } from "@/components/lockdown-overlay";
import { LoginQr } from "@/components/login-qr";
import { ParticlePlexus } from "@/components/particle-plexus";
import { PinKeypad } from "@/components/pin-keypad";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [mode, setMode] = useState<"qr" | "pin">("qr");
  const [locked, setLocked] = useState(false);

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden p-4">
      <ParticlePlexus />
      <div className="glass relative w-full max-w-sm rounded-2xl p-6 shadow-[0_0_40px_-12px_var(--primary)]">
        {locked && <LockdownOverlay />}

        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold">Telabotpower</h1>
          <p className="text-sm text-muted-foreground">
            {mode === "qr" ? "เข้าสู่ระบบด้วย Telegram" : "เข้าสู่ระบบด้วย PIN"}
          </p>
        </div>

        {mode === "qr" ? <LoginQr /> : <PinKeypad onLock={() => setLocked(true)} />}

        <div className="mt-6 flex flex-col items-center gap-2 text-sm">
          <Button
            variant="link"
            className="h-auto p-0"
            onClick={() => setMode((m) => (m === "qr" ? "pin" : "qr"))}
          >
            {mode === "qr" ? "ใช้ PIN แทน" : "ใช้ Telegram QR"}
          </Button>
          <Link href="/login/super" className="text-muted-foreground hover:text-foreground">
            เข้าสู่ระบบสำหรับ Super Admin →
          </Link>
        </div>
      </div>
    </main>
  );
}
