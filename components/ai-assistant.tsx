"use client";

import { Bot, Send, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { askAssistant, type AskSource } from "@/lib/actions/assistant";
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

type Msg = {
  id: string;
  role: "user" | "ai";
  text: string;
  sources?: AskSource[];
  confidence?: number;
};

const SUGGESTIONS = [
  "ค่าจัดส่งเท่าไหร่?",
  "ลูกค้ารีเซ็ตรหัสผ่านยังไง?",
  "เงื่อนไขการสมัครตัวแทนจำหน่าย",
  "นโยบายการคืนสินค้า",
];

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
      <div className="max-w-[80%] space-y-1">
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm",
            isUser
              ? "whitespace-pre-wrap bg-primary text-primary-foreground"
              : "prose prose-sm dark:prose-invert max-w-none border border-border bg-card"
          )}
        >
          {isUser ? msg.text : <ReactMarkdown>{msg.text}</ReactMarkdown>}
        </div>
        {!isUser && typeof msg.confidence === "number" && msg.confidence > 0 && (
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
                msg.confidence >= 0.8
                  ? "border-success/30 bg-success/10 text-success"
                  : msg.confidence >= 0.5
                    ? "border-warning/30 bg-warning/10 text-warning"
                    : "border-danger/30 bg-danger/10 text-danger"
              )}
            >
              ความมั่นใจ {Math.round(msg.confidence * 100)}%
            </span>
            {msg.sources && msg.sources.length > 0 && (
              <details className="flex-1 rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                  อ้างอิง {msg.sources.length} รายการ
                </summary>
                <ul className="mt-2 space-y-1.5">
                  {msg.sources.map((s, i) => (
                    <li
                      key={i}
                      className="whitespace-pre-wrap rounded-lg border border-border bg-background/60 p-2 text-muted-foreground"
                    >
                      {s.content}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
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
  const seq = useRef(0);
  const newId = (prefix: string) => `${prefix}-${seq.current++}`;

  const kbName = collections.find((c) => c.id === kb)?.name ?? "";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  async function ask(q: string) {
    const question = q.trim();
    if (!kb || !question || thinking) return;
    setMessages((m) => [...m, { id: newId("u"), role: "user", text: question }]);
    setInput("");
    setThinking(true);
    const res = await askAssistant(kb, question);
    setThinking(false);
    if (res.ok) {
      setMessages((m) => [
        ...m,
        {
          id: newId("a"),
          role: "ai",
          text: res.answer,
          sources: res.sources,
          confidence: res.confidence,
        },
      ]);
    } else {
      toast.error(res.error);
      setMessages((m) => [...m, { id: newId("a"), role: "ai", text: `⚠️ ${res.error}` }]);
    }
  }

  return (
    <div className="space-y-4">
      {/* Knowledge Base picker */}
      <div className="glass flex flex-wrap items-center gap-3 rounded-xl p-3">
        <span className="text-sm text-muted-foreground">เลือกคลังความรู้ก่อนถาม:</span>
        <Select value={kb} onValueChange={(v) => setKb(v ?? "")}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="— เลือกคลังความรู้ —">
              {kbName || undefined}
            </SelectValue>
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
