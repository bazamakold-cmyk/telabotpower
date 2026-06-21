"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { ParticlePlexus } from "@/components/particle-plexus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SuperLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin147");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/auth/super", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setBusy(false);
    if (res.ok) {
      toast.success("เข้าสู่ระบบสำเร็จ");
      router.push("/");
      router.refresh();
      return;
    }
    toast.error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
  }

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden p-4">
      <ParticlePlexus />
      <div className="glass relative w-full max-w-sm rounded-2xl p-6 shadow-[0_0_40px_-12px_var(--primary)]">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold">Super Admin</h1>
          <p className="text-sm text-muted-foreground">กรอกชื่อผู้ใช้และรหัสผ่าน</p>
        </div>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="u">ชื่อผู้ใช้</Label>
            <Input
              id="u"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p">รหัสผ่าน</Label>
            <Input
              id="p"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">ทดสอบ: admin147 / admin123</p>
        <div className="mt-3 text-center text-sm">
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            ← เข้าสู่ระบบด้วย PIN
          </Link>
        </div>
      </div>
    </main>
  );
}
