"use client";

import { Eye, EyeOff, Webhook } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function SettingsBotTab() {
  const [token, setToken] = useState("123456789:AAExampleMockToken");
  const [show, setShow] = useState(false);
  const [autoReply, setAutoReply] = useState(true);
  const [testing, setTesting] = useState(false);

  async function testGetMe() {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 600));
    setTesting(false);
    toast.success("เชื่อมต่อสำเร็จ: @TelabotpowerBot (จำลอง)");
  }

  return (
    <div className="space-y-6">
      <section className="glass space-y-3 rounded-xl p-4">
        <h3 className="font-display font-semibold">Bot Token</h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={show ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "ซ่อน token" : "แสดง token"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <Button onClick={() => toast.success("บันทึก token แล้ว (จำลอง)")}>บันทึก</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          เก็บแบบเข้ารหัสในฐานข้อมูล ไม่แสดงค่าเต็มบน production
        </p>
      </section>

      <section className="glass space-y-3 rounded-xl p-4">
        <h3 className="flex items-center gap-2 font-display font-semibold">
          <Webhook className="size-4 text-primary" aria-hidden /> Webhook
        </h3>
        <dl className="grid gap-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">URL</dt>
            <dd className="truncate font-mono">/api/telegram/webhook</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Pending updates</dt>
            <dd className="tabular-nums">0</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Last error</dt>
            <dd className="text-success">ไม่มี</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => toast.success("ตั้ง webhook แล้ว (จำลอง)")}>
            ตั้ง / รีเซ็ต Webhook
          </Button>
          <Button variant="outline" disabled={testing} onClick={testGetMe}>
            {testing ? "กำลังทดสอบ…" : "ทดสอบการเชื่อมต่อ (getMe)"}
          </Button>
        </div>
      </section>

      <section className="glass flex items-center justify-between gap-3 rounded-xl p-4">
        <div>
          <h3 className="font-display font-semibold">AI Auto-reply (ค่าเริ่มต้นทั้งระบบ)</h3>
          <p className="text-xs text-muted-foreground">แต่ละกลุ่ม override ได้ที่หน้า “กลุ่ม”</p>
        </div>
        <Switch checked={autoReply} onCheckedChange={setAutoReply} aria-label="AI auto-reply" />
      </section>
    </div>
  );
}
