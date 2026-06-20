"use client";

import { KeyRound, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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

function KeyRow({ name, ok }: { name: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-muted-foreground">{name}</span>
      <span className={ok ? "text-success" : "text-danger"}>{ok ? "ตั้งค่าแล้ว" : "ยังไม่ตั้ง"}</span>
    </div>
  );
}

export function SettingsAiTab() {
  const [provider, setProvider] = useState("anthropic");
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [persona, setPersona] = useState("ตอบสุภาพ กระชับ ตรงประเด็น เป็นภาษาไทย");
  const [threshold, setThreshold] = useState("0.7");
  const [topK, setTopK] = useState("5");
  const [scoring, setScoring] = useState(true);
  const [playground, setPlayground] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function run() {
    if (!playground.trim()) return;
    setRunning(true);
    setAnswer(null);
    await new Promise((r) => setTimeout(r, 800));
    setRunning(false);
    setAnswer("(คำตอบจำลอง) จากคลังความรู้: ค่าจัดส่งเริ่มต้น 40 บาท ส่งฟรีเมื่อซื้อครบ 1,000 บาท");
  }

  return (
    <div className="space-y-6">
      <section className="glass grid gap-4 rounded-xl p-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="provider">Provider</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger id="provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
              <SelectItem value="openai-compatible">OpenAI-compatible (Hermes/Typhoon)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="model">Chat model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger id="model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-opus-4-8">claude-opus-4-8</SelectItem>
              <SelectItem value="claude-sonnet-4-6">claude-sonnet-4-6</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="persona">Persona / System prompt กลาง</Label>
          <Textarea
            id="persona"
            rows={2}
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
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
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="topk">RAG top-k</Label>
          <Input
            id="topk"
            inputMode="numeric"
            value={topK}
            onChange={(e) => setTopK(e.target.value)}
          />
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

      <section className="glass space-y-3 rounded-xl p-4">
        <h3 className="flex items-center gap-2 font-display font-semibold">
          <Play className="size-4 text-primary" aria-hidden /> Playground
        </h3>
        <Textarea
          rows={2}
          value={playground}
          onChange={(e) => setPlayground(e.target.value)}
          placeholder="พิมพ์คำถามเพื่อลองให้ AI ตอบจากคลังความรู้"
        />
        <Button disabled={running} onClick={run}>
          {running ? "กำลังคิด…" : "ทดสอบถาม"}
        </Button>
        {answer && <div className="rounded-lg border bg-muted/30 p-3 text-sm">{answer}</div>}
      </section>

      <div className="flex justify-end">
        <Button onClick={() => toast.success("บันทึกการตั้งค่า AI แล้ว (จำลอง)")}>
          บันทึกการตั้งค่า
        </Button>
      </div>
    </div>
  );
}
