"use client";

import { Eye, EyeOff, Webhook } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  configureWebhook,
  fetchWebhookInfo,
  saveBotToken,
  setAiAutoReply,
  testGetMe,
} from "@/lib/actions/telegram";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

type HookInfo = { url: string | null; pending: number; lastError: string | null };

export function SettingsBotTab({
  hasToken,
  aiAutoReply,
  webhookUrl,
}: {
  hasToken: boolean;
  aiAutoReply: boolean;
  webhookUrl: string | null;
}) {
  const [token, setToken] = useState("");
  const [show, setShow] = useState(false);
  const [autoReply, setAutoReply] = useState(aiAutoReply);
  const [hook, setHook] = useState<HookInfo | null>(webhookUrl ? { url: webhookUrl, pending: 0, lastError: null } : null);
  const [pending, start] = useTransition();

  function save() {
    if (!token.trim()) {
      toast.error("กรุณากรอก token");
      return;
    }
    start(async () => {
      const r = await saveBotToken(token);
      if (r.ok) {
        toast.success("บันทึก token แล้ว (เข้ารหัสในฐานข้อมูล)");
        setToken("");
      } else {
        toast.error(r.error);
      }
    });
  }

  function test() {
    start(async () => {
      const r = await testGetMe();
      if (r.ok) toast.success(`เชื่อมต่อสำเร็จ: @${r.username ?? r.name ?? "bot"}`);
      else toast.error(r.error);
    });
  }

  function loadHook() {
    start(async () => {
      const r = await fetchWebhookInfo();
      if (r.ok) setHook({ url: r.url, pending: r.pending, lastError: r.lastError });
      else toast.error(r.error);
    });
  }

  function setupHook() {
    start(async () => {
      const r = await configureWebhook(window.location.origin);
      if (r.ok) {
        toast.success("ตั้ง webhook แล้ว");
        loadHook();
      } else {
        toast.error(r.error);
      }
    });
  }

  function toggleAuto(v: boolean) {
    setAutoReply(v);
    start(async () => {
      const r = await setAiAutoReply(v);
      if (!r.ok) {
        toast.error(r.error);
        setAutoReply(!v);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="glass space-y-3 rounded-xl p-4">
        <h3 className="flex items-center gap-2 font-display font-semibold">
          Bot Token
          <span
            className={
              hasToken
                ? "rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs text-success"
                : "rounded-full border border-warn/30 bg-warn/10 px-2 py-0.5 text-xs text-warn"
            }
          >
            {hasToken ? "ตั้งค่าแล้ว" : "ยังไม่ได้ตั้ง"}
          </span>
        </h3>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={show ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={hasToken ? "•••••• (กรอกใหม่เพื่อเปลี่ยน)" : "วาง Bot Token จาก BotFather"}
              className="pr-10 font-mono"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "ซ่อน" : "แสดง"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <Button onClick={save} disabled={pending}>
            บันทึก
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">เก็บแบบเข้ารหัส (AES-256-GCM) ไม่แสดงค่าเต็ม</p>
        <Button variant="outline" disabled={pending} onClick={test}>
          ทดสอบการเชื่อมต่อ (getMe)
        </Button>
      </section>

      <section className="glass space-y-3 rounded-xl p-4">
        <h3 className="flex items-center gap-2 font-display font-semibold">
          <Webhook className="size-4 text-primary" aria-hidden /> Webhook
        </h3>
        <dl className="grid gap-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">URL</dt>
            <dd className="truncate font-mono">{hook?.url ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Pending updates</dt>
            <dd className="tabular-nums">{hook?.pending ?? 0}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Last error</dt>
            <dd className={hook?.lastError ? "text-danger" : "text-success"}>
              {hook?.lastError ?? "ไม่มี"}
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={pending} onClick={setupHook}>
            ตั้ง / รีเซ็ต Webhook
          </Button>
          <Button variant="outline" disabled={pending} onClick={loadHook}>
            ตรวจสอบสถานะ
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          ⚠️ Webhook ต้องเป็น URL สาธารณะ (https) — ใช้ได้หลัง deploy ขึ้น Vercel เท่านั้น
        </p>
      </section>

      <section className="glass flex items-center justify-between gap-3 rounded-xl p-4">
        <div>
          <h3 className="font-display font-semibold">AI Auto-reply (ค่าเริ่มต้นทั้งระบบ)</h3>
          <p className="text-xs text-muted-foreground">แต่ละกลุ่ม override ได้ที่หน้า “กลุ่ม”</p>
        </div>
        <Switch checked={autoReply} onCheckedChange={toggleAuto} aria-label="AI auto-reply" />
      </section>
    </div>
  );
}
