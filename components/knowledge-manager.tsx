"use client";

import { FileText, FolderPlus, HelpCircle, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import { reindexCollection } from "@/lib/actions/ingest";
import {
  createCollection,
  createFaq,
  deleteCollection,
  deleteDoc,
  uploadFile,
} from "@/lib/actions/knowledge";
import { FileDropzone } from "@/components/file-dropzone";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const router = useRouter();
  const [selected, setSelected] = useState(collections[0]?.id ?? "");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newCol, setNewCol] = useState<{ name: string; description: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<KnowledgeCollection | null>(null);
  const [pending, startTransition] = useTransition();

  const visible = initialDocs.filter((d) => d.collectionId === selected);
  const delDocCount = confirmDel
    ? initialDocs.filter((d) => d.collectionId === confirmDel.id).length
    : 0;

  function addCollection() {
    if (!newCol || !newCol.name.trim()) return;
    startTransition(async () => {
      const res = await createCollection(newCol.name, newCol.description);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (res.id) setSelected(res.id);
      setNewCol(null);
      toast.success("เพิ่มหมวดหมู่แล้ว");
      router.refresh();
    });
  }

  function submitFaq(e: FormEvent) {
    e.preventDefault();
    if (!selected || !question.trim() || !answer.trim()) return;
    startTransition(async () => {
      const res = await createFaq(selected, question, answer);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setQuestion("");
      setAnswer("");
      toast.success("เพิ่ม FAQ แล้ว");
      router.refresh();
    });
  }

  function removeDoc(id: string) {
    startTransition(async () => {
      const res = await deleteDoc(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("ลบแล้ว");
      router.refresh();
    });
  }

  function confirmDelete() {
    const target = confirmDel;
    if (!target) return;
    startTransition(async () => {
      const res = await deleteCollection(target.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (selected === target.id) {
        setSelected(collections.find((c) => c.id !== target.id)?.id ?? "");
      }
      setConfirmDel(null);
      const tail = res.deletedDocs > 0 ? ` และเอกสาร ${res.deletedDocs} รายการ` : "";
      toast.success(`ลบหมวดหมู่ “${target.name}”${tail} แล้ว`);
      router.refresh();
    });
  }

  function uploadFiles(files: File[]) {
    if (!selected) {
      toast.error("กรุณาเลือกหมวดหมู่ก่อนอัปโหลด");
      return;
    }
    startTransition(async () => {
      let uploaded = 0;
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("collectionId", selected);
        const res = await uploadFile(fd);
        if (res.ok) {
          uploaded++;
        } else {
          toast.error(`${file.name}: ${res.error}`);
        }
      }
      if (uploaded > 0) {
        toast.success(`อัปโหลด ${uploaded} ไฟล์เรียบร้อย — กำลังสร้างดัชนี RAG`);
        router.refresh();
      }
    });
  }

  function reindex() {
    if (!selected) return;
    startTransition(async () => {
      const res = await reindexCollection(selected);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `สร้างดัชนีแล้ว ${res.indexed} เอกสาร${res.failed ? ` (ข้าม ${res.failed})` : ""}`
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {collections.map((c) => (
          <div key={c.id} className="inline-flex items-center gap-0.5">
            <Button
              size="sm"
              variant={selected === c.id ? "default" : "outline"}
              onClick={() => setSelected(c.id)}
            >
              {c.name}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label={`ลบหมวดหมู่ ${c.name}`}
              className="size-7 text-muted-foreground hover:text-destructive"
              onClick={() => setConfirmDel(c)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setNewCol({ name: "", description: "" })}>
          <FolderPlus className="size-4" /> เพิ่มหมวดหมู่
        </Button>
        {selected && (
          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={reindex}
            title="สร้าง embedding ของเอกสารในคลังนี้ใหม่ (ใช้หลังเพิ่ม API key)"
          >
            <RefreshCw className="size-4" /> สร้างดัชนี (RAG)
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <FileDropzone onFiles={uploadFiles} disabled={pending} />
        <form onSubmit={submitFaq} className="glass space-y-3 rounded-xl p-4">
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
          <Button type="submit" disabled={pending || !selected}>
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
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="ลบ"
                    disabled={pending}
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

      <Dialog open={newCol !== null} onOpenChange={(o) => !o && setNewCol(null)}>
        <DialogContent>
          {newCol && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                addCollection();
              }}
            >
              <DialogHeader>
                <DialogTitle>เพิ่มหมวดหมู่คลังความรู้</DialogTitle>
                <DialogDescription>
                  สร้างชุดคลังความรู้ใหม่ แล้วผูกกับกลุ่มได้ที่หน้า “กลุ่ม”
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="col-name">ชื่อหมวดหมู่</Label>
                <Input
                  id="col-name"
                  required
                  value={newCol.name}
                  onChange={(e) => setNewCol((c) => (c ? { ...c, name: e.target.value } : c))}
                  placeholder="เช่น คู่มือสินค้าใหม่"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="col-desc">คำอธิบาย (ไม่บังคับ)</Label>
                <Textarea
                  id="col-desc"
                  rows={2}
                  value={newCol.description}
                  onChange={(e) => setNewCol((c) => (c ? { ...c, description: e.target.value } : c))}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setNewCol(null)}>
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "กำลังบันทึก…" : "บันทึก"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmDel !== null}
        onOpenChange={(o) => {
          if (!o && !pending) setConfirmDel(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ลบหมวดหมู่นี้?</DialogTitle>
            <DialogDescription>
              ลบ “{confirmDel?.name}” อย่างถาวร
              {delDocCount > 0 ? ` พร้อมเอกสารทั้งหมด ${delDocCount} รายการในหมวดนี้` : ""} — กู้คืนไม่ได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="ghost" disabled={pending} onClick={() => setConfirmDel(null)}>
              ยกเลิก
            </Button>
            <Button type="button" variant="destructive" disabled={pending} onClick={confirmDelete}>
              {pending ? "กำลังลบ…" : "ลบถาวร"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
