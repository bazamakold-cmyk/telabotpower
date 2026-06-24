"use client";

import { KeyRound } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveAiSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const MODELS = [
  { value: "claude-opus-4-8", label: "Claude Opus 4.8 (ฉลาดสุด — ช้ากว่า)" },
  { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (แนะนำ — เร็ว/ดี)" },
  { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (เร็วสุด — ถูกสุด)" },
];

function KeyRow({ name, ok }: { name: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-muted-foreground">{name}</span>
      <span className={ok ? "text-success" : "text-danger"}>{ok ? "ตั้งค่าแล้ว" : "ยังไม่ตั้ง"}</span>
    </div>
  );
}

export function SettingsAiTab({
  initialChatModel = "claude-sonnet-4-6",
  initialSystemPrompt = "",
  initialThreshold = 0.7,
  initialTopK = 5,
  initialScoring = true,
}: {
  initialChatModel?: string;
  initialSystemPrompt?: string;
  initialThreshold?: number;
  initialTopK?: number;
  initialScoring?: boolean;
}) {
  const [model, setModel] = useState(initialChatModel);
  const [persona, setPersona] = useState(
    initialSystemPrompt || "ตอบสุภาพ กระชับ ตรงประเด็น เป็นภาษาไทย"
  );
  const [threshold, setThreshold] = useState(String(initialThreshold));
  const [topK, setTopK] = useState(String(initialTopK));
  const [scoring, setScoring] = useState(initialScoring);
  const [pending, startTransition] = useTransition();

  const modelLabel = MODELS.find((m) => m.value === model)?.label ?? model;

  function save() {
    const conf = parseFloat(threshold);
    const k = parseInt(topK, 10);
    if (isNaN(conf) || conf < 0 || conf > 1) {
      toast.error("Threshold ต้องเป็นตัวเลข 0–1");
      return;
    }
    if (isNaN(k) || k < 1 || k > 20) {
      toast.error("RAG top-k ต้องเป็นตัวเลข 1–20");
      return;
    }
    startTransition(async () => {
      const res = await saveAiSettings({
        chatModel: model,
        systemPrompt: persona,
        autoReplyMinConfidence: conf,
        ragTopK: k,
        scoringEnabled: scoring,
      });
      if (res.ok) {
        toast.success("บันทึกการตั้งค่า AI แล้ว");
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="glass grid gap-4 rounded-xl p-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="model">Chat model</Label>
          <Select value={model} onValueChange={(v) => setModel(v ?? model)}>
            <SelectTrigger id="model">
              <SelectValue>{modelLabel}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Opus ฉลาดสุดแต่ช้าและแพงกว่า — Sonnet เหมาะสำหรับการใช้งานทั่วไป
          </p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="persona">System prompt (persona)</Label>
          <Textarea
            id="persona"
            rows={3}
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="เช่น ตอบสุภาพ กระชับ ตรงประเด็น เป็นภาษาไทย"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="threshold">Auto-reply threshold (0–1)</Label>
          <Input
            id="threshold"
            inputMode="decimal"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            ความมั่นใจขั้นต่ำที่บอทจะส่งคำตอบอัตโนมัติ (ค่าแนะนำ 0.5–0.7)
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="topk">RAG top-k</Label>
          <Input
            id="topk"
            inputMode="numeric"
            value={topK}
            onChange={(e) => setTopK(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">จำนวน chunk ที่ดึงมาให้ AI อ่าน (ค่าแนะนำ 3–5)</p>
        </div>
      </section>

      <section className="glass flex items-center justify-between gap-3 rounded-xl p-4">
        <div>
          <h3 className="font-display font-semibold">ให้คะแนนคุณภาพ (Quality scoring)</h3>
          <p className="text-xs text-muted-foreground">ใช้ AI ประเมินคุณภาพการตอบ → ป้อน KPI</p>
        </div>
        <Switch checked={scoring} onCheckedChange={setScoring} aria-label="quality scoring" />
      </section>

      <section className="glass space-y-2 rounded-xl p-4">
        <h3 className="flex items-center gap-2 font-display font-semibold">
          <KeyRound className="size-4 text-primary" aria-hidden /> API Keys (จาก env)
        </h3>
        <div className="grid gap-1 text-sm">
          <KeyRow name="ANTHROPIC_API_KEY" ok />
          <KeyRow name="VOYAGE_API_KEY" ok />
        </div>
        <p className="text-xs text-muted-foreground">
          ตั้งค่าใน Vercel env — ไม่แก้ผ่าน UI เพื่อความปลอดภัย
        </p>
      </section>

      <div className="flex justify-end">
        <Button onClick={save} disabled={pending}>
          {pending ? "กำลังบันทึก…" : "บันทึกการตั้งค่า"}
        </Button>
      </div>
    </div>
  );
}
