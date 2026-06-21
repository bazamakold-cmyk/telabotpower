"use client";

import { Bot, Send, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { KnowledgeCollection } from "@/lib/types";
import { cn } from "@/lib/utils";

type Msg = { id: string; role: "user" | "ai"; text: string };

const SUGGESTIONS = [
  "ค่าจัดส่งเท่าไหร่?",
  "ลูกค้ารีเซ็ตรหัสผ่านยังไง?",
  "เงื่อนไขการสมัครตัวแทนจำหน่าย",
  "นโยบายการคืนสินค้า",
];

function mockAnswer(q: string, kbName: string): string {
  const t = q.toLowerCase();
  let body =
    "นี่คือคำตอบที่แนะนำ (ตัวอย่างจำลอง) — เมื่อต่อ backend จริงจะดึงจากเอกสาร/FAQ ด้วย RAG + Claude";
  if (q.includes("จัดส่ง") || q.includes("ค่าส่ง") || t.includes("ship")) {
    body = "ค่าจัดส่งเริ่มต้น 40 บาท ส่งฟรีเมื่อซื้อครบ 1,000 บาท";
  } else if (q.includes("รหัส") || q.includes("รีเซ็ต") || t.includes("password")) {
    body = "ให้ลูกค้าไปที่ ตั้งค่า > ความปลอดภัย > รีเซ็ตรหัสผ่าน";
  } else if (q.includes("ตัวแทน")) {
    body = "เปิดรับสมัครตัวแทน ขั้นต่ำสั่งซื้อ 5,000 บาท/เดือน รับส่วนลด 20%";
  }
  return `จากคลัง “${kbName}”: ${body} ครับ`;
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      <span
        className={cn(
          "grid size-8 shrink-0 place-items-center rounded-full border",
          isUser ? "border-border bg-muted" : "border-primary/30 bg-primary/10 text-primary"
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </span>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
          isUser ? "bg-primary text-primary-foreground" : "border border-border bg-card"
        )}
      >
        {msg.text}
      </div>
    </div>
  );
}

export function AiAssistant({ collections }: { collections: KnowledgeCollection[] }) {
  const [kb, setKb] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const kbName = collections.find((c) => c.id === kb)?.name ?? "";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function ask(q: string) {
    const question = q.trim();
    if (!kb || !question || thinking) return;
    setMessages((m) => [
      ...m,
      { id: `u-${Math.round(performance.now())}`, role: "user", text: question },
    ]);
    setInput("");
    setThinking(true);
    await new Promise((r) => setTimeout(r, 700));
    setMessages((m) => [
      ...m,
      { id: `a-${Math.round(performance.now())}`, role: "ai", text: mockAnswer(question, kbName) },
    ]);
    setThinking(false);
  }

  return (
    <div className="space-y-4">
      {/* Knowledge Base picker */}
      <div className="glass flex flex-wrap items-center gap-3 rounded-xl p-3">
        <span className="text-sm text-muted-foreground">เลือกคลังความรู้ก่อนถาม:</span>
        <Select value={kb} onValueChange={(v) => setKb(v ?? "")}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="— เลือกคลังความรู้ —" />
          </SelectTrigger>
          <SelectContent>
            {collections.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="glass max-h-[55vh] min-h-[300px] space-y-4 overflow-y-auto rounded-xl p-4">
        {messages.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 text-center">
            <span className="grid size-12 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
              <Sparkles className="size-6" />
            </span>
            <p className="font-display text-lg font-semibold">
              {kb ? "ถามผมได้เลย" : "เลือกคลังความรู้ก่อน"}
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {kb
                ? `ผมจะค้นคำตอบจากคลัง “${kbName}” ให้ — พิมพ์คำถาม หรือเลือกตัวอย่างด้านล่าง`
                : "เลือกคลังความรู้ที่ต้องการให้ AI ใช้ตอบ แล้วเริ่มถามได้เลย"}
            </p>
          </div>
        ) : (
          messages.map((m) => <Bubble key={m.id} msg={m} />)
        )}
        {thinking && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="size-4 text-primary" aria-hidden /> กำลังค้นคำตอบ…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <Button key={s} size="sm" variant="outline" onClick={() => ask(s)} disabled={!kb || thinking}>
            {s}
          </Button>
        ))}
      </div>

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={kb ? "พิมพ์คำถาม เช่น ค่าจัดส่งเท่าไหร่?" : "เลือกคลังความรู้ก่อน…"}
          disabled={!kb}
        />
        <Button type="submit" disabled={!kb || thinking || !input.trim()}>
          <Send className="size-4" /> ส่ง
        </Button>
      </form>
    </div>
  );
}
