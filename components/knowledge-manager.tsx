"use client";

import { FileText, HelpCircle, Plus, RefreshCw, Trash2 } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/file-dropzone";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { IngestStatus, KnowledgeCollection, KnowledgeDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

const ingestMeta: Record<IngestStatus, { label: string; cls: string }> = {
  PENDING: { label: "รอประมวลผล", cls: "text-muted-foreground border-border bg-muted/40" },
  PROCESSING: { label: "กำลังประมวลผล", cls: "text-info border-info/30 bg-info/10" },
  READY: { label: "พร้อมใช้", cls: "text-success border-success/30 bg-success/10" },
  FAILED: { label: "ล้มเหลว", cls: "text-danger border-danger/30 bg-danger/10" },
};

function IngestBadge({ status }: { status: IngestStatus }) {
  const m = ingestMeta[status];
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium", m.cls)}>
      {m.label}
    </span>
  );
}

export function KnowledgeManager({
  collections,
  initialDocs,
}: {
  collections: KnowledgeCollection[];
  initialDocs: KnowledgeDoc[];
}) {
  const [selected, setSelected] = useState(collections[0]?.id ?? "");
  const [docs, setDocs] = useState(initialDocs);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const visible = docs.filter((d) => d.collectionId === selected);

  function addFiles(files: File[]) {
    const added: KnowledgeDoc[] = files.map((f, i) => ({
      id: `doc-${i}-${Math.round(performance.now())}`,
      collectionId: selected,
      type: "FILE",
      title: f.name,
      status: "PENDING",
    }));
    setDocs((p) => [...added, ...p]);
    toast.success(`อัปโหลด ${files.length} ไฟล์ (จำลอง) — เข้าคิวประมวลผล`);
  }

  function addFaq(e: FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    setDocs((p) => [
      {
        id: `faq-${Math.round(performance.now())}`,
        collectionId: selected,
        type: "FAQ",
        title: question.trim(),
        question: question.trim(),
        answer: answer.trim(),
        status: "READY",
      },
      ...p,
    ]);
    setQuestion("");
    setAnswer("");
    toast.success("เพิ่ม FAQ แล้ว (จำลอง)");
  }

  function removeDoc(id: string) {
    setDocs((p) => p.filter((d) => d.id !== id));
    toast.success("ลบแล้ว (จำลอง)");
  }

  function retry(id: string) {
    setDocs((p) => p.map((d) => (d.id === id ? { ...d, status: "PROCESSING" } : d)));
    toast.message("กำลังลองประมวลผลใหม่ (จำลอง)");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {collections.map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant={selected === c.id ? "default" : "outline"}
            onClick={() => setSelected(c.id)}
          >
            {c.name}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FileDropzone onFiles={addFiles} />
        <form onSubmit={addFaq} className="glass space-y-3 rounded-xl p-4">
          <h3 className="font-display font-semibold">เพิ่ม FAQ ด้วยมือ</h3>
          <div className="space-y-1.5">
            <Label htmlFor="q">คำถาม</Label>
            <Input
              id="q"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="เช่น ค่าจัดส่งเท่าไหร่?"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="a">คำตอบ</Label>
            <Textarea
              id="a"
              rows={3}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="คำตอบสำหรับ AI ใช้อ้างอิง"
            />
          </div>
          <Button type="submit">
            <Plus className="size-4" /> เพิ่ม FAQ
          </Button>
        </form>
      </div>

      <section className="space-y-3">
        <h3 className="font-display font-semibold">เอกสารในคลังนี้</h3>
        {visible.length === 0 ? (
          <EmptyState title="ยังไม่มีเอกสารในคลังนี้" description="อัปโหลดไฟล์หรือเพิ่ม FAQ ด้านบน" />
        ) : (
          <div className="space-y-2">
            {visible.map((d) => (
              <div key={d.id} className="glass flex items-center justify-between gap-3 rounded-xl p-3">
                <div className="flex min-w-0 items-center gap-3">
                  {d.type === "FAQ" ? (
                    <HelpCircle className="size-5 shrink-0 text-primary" aria-hidden />
                  ) : (
                    <FileText className="size-5 shrink-0 text-primary" aria-hidden />
                  )}
                  <span className="truncate text-sm">{d.title}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <IngestBadge status={d.status} />
                  {d.status === "FAILED" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="ลองใหม่"
                      onClick={() => retry(d.id)}
                    >
                      <RefreshCw className="size-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="ลบ"
                    onClick={() => removeDoc(d.id)}
                  >
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
