"use client";

import { QrCode } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LoginQr() {
  const [expired, setExpired] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative grid size-48 place-items-center rounded-xl border border-primary/40 bg-card/40 backdrop-blur">
        <QrCode className="size-28 text-primary" aria-hidden />
        {expired && (
          <div className="absolute inset-0 grid place-items-center rounded-xl bg-background/80 text-sm text-muted-foreground">
            QR หมดอายุ
          </div>
        )}
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {expired ? "QR หมดอายุแล้ว" : "สแกนด้วยแอป Telegram เพื่อเข้าสู่ระบบ"}
      </p>
      {expired && (
        <Button variant="outline" onClick={() => setExpired(false)}>
          สร้าง QR ใหม่
        </Button>
      )}
    </div>
  );
}
