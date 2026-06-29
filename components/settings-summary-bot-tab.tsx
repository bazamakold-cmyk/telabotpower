"use client";

import { Eye, EyeOff, Send, Webhook } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  configureSummaryWebhook,
  saveSummaryBotToken,
  saveSummaryGroupChatId,
  testSummaryBotPing,
  testSummaryBotToken,
} from "@/lib/actions/summary-bot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SettingsSummaryBotTab({
  hasToken,
  hasChatId,
  webhookUrl,
}: {
  hasToken: boolean;
  hasChatId: boolean;
  webhookUrl: string | null;
}) {
  const [token, setToken] = useState("");
  const [show, setShow] = useState(false);
  const [chatId, setChatId] = useState("");
  const [hookUrl, setHookUrl] = useState<string | null>(webhookUrl);
  const [pending, start] = useTransition();

  function saveToken() {
    if (!token.trim()) { toast.error("กรุณากรอก token"); return; }
    start(async () => {
      const r = await saveSummaryBotToken(token);
      if (r.ok) { toast.success("บันทึก token แล้ว"); setToken(""); }
      else toast.error(r.error);
    });
  }

  function testToken() {
    if (!token.trim()) { toast.error("กรอก token ก่อนทดสอบ"); return; }
    start(async () => {
      const r = await testSummaryBotToken(token);
      if (r.ok) toast.success(`เชื่อมต่อสำเร็จ: @${r.username ?? r.name ?? "bot"}`);
      else toast.error(r.error);
    });
  }

  function saveChatId() {
    if (!chatId.trim()) { toast.error("กรุณากรอก Chat ID"); return; }
    start(async () => {
      const r = await saveSummaryGroupChatId(chatId);
      if (r.ok) { toast.success("บันทึก Chat ID แล้ว"); setChatId(""); }
      else toast.error(r.error);
    });
  }

  function setupWebhook() {
    start(async () => {
      const r = await configureSummaryWebhook(window.location.origin);
      if (r.ok) { toast.success("ตั้ง webhook แล้ว"); setHookUrl(r.url); }
      else toast.error(r.error);
    });
  }

  function ping() {
    start(async () => {
      const r = await testSummaryBotPing();
      if (r.ok) toast.success("ส่งข้อความทดสอบสำเร็จ");
      else toast.error(r.error);
    });
  }

  return (
    <div className="space-y-6">
      {/* Token */}
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
          <Button onClick={saveToken} disabled={pending}>บันทึก</Button>
        </div>
        <p className="text-xs text-muted-foreground">เก็บแบบเข้ารหัส (AES-256-GCM) ไม่แสดงค่าเต็ม</p>
        <Button variant="outline" disabled={pending} onClick={testToken}>
          ทดสอบเชื่อมต่อ
        </Button>
      </section>

      {/* Group Chat ID */}
      <section className="glass space-y-3 rounded-xl p-4">
        <h3 className="flex items-center gap-2 font-display font-semibold">
          Group Chat ID (กลุ่ม Admin ทีม)
          <span
            className={
              hasChatId
                ? "rounded-full border border-success/30 bg-success/10 px-2 py-0.5 text-xs text-success"
                : "rounded-full border border-warn/30 bg-warn/10 px-2 py-0.5 text-xs text-warn"
            }
          >
            {hasChatId ? "ตั้งค่าแล้ว" : "ยังไม่ได้ตั้ง"}
          </span>
        </h3>
        <div className="flex gap-2">
          <Input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="-1001234567890"
            className="font-mono"
          />
          <Button onClick={saveChatId} disabled={pending}>บันทึก</Button>
        </div>
        <p className="text-xs text-muted-foreground">
          วิธีหา Chat ID: เพิ่ม @userinfobot ในกลุ่ม แล้วพิมพ์ /start
        </p>
      </section>

      {/* Webhook */}
      <section className="glass space-y-3 rounded-xl p-4">
        <h3 className="flex items-center gap-2 font-display font-semibold">
          <Webhook className="size-4 text-primary" aria-hidden /> Webhook
        </h3>
        <dl className="grid gap-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">URL</dt>
            <dd className="truncate font-mono">{hookUrl ?? "—"}</dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={pending} onClick={setupWebhook}>
            ตั้ง / รีเซ็ต Webhook
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          ⚠️ Webhook ต้องเป็น URL สาธารณะ (https) — ใช้ได้หลัง deploy ขึ้น Vercel
        </p>
      </section>

      {/* Test ping */}
      <section className="glass space-y-3 rounded-xl p-4">
        <h3 className="font-display font-semibold">ทดสอบส่งข้อความ</h3>
        <p className="text-sm text-muted-foreground">
          ส่งข้อความ ping ไปยังกลุ่ม Admin เพื่อยืนยันว่า Bot ทำงานได้
        </p>
        <Button disabled={pending} onClick={ping}>
          <Send className="mr-2 size-4" />
          ทดสอบส่งข้อความ
        </Button>
      </section>
    </div>
  );
}
