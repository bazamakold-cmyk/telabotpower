"use client";

import { Check, MessageSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api-fetch";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Draft = {
  id: string;
  sourceMsg: string;
  draftText: string;
  createdAt: string;
  group: { id: string; name: string; chatId: string };
};

function DraftCard({ draft, onDone }: { draft: Draft; onDone: () => void }) {
  const [text, setText] = useState(draft.draftText);
  const [busy, setBusy] = useState<"send" | "skip" | null>(null);

  async function act(action: "send" | "skip") {
    setBusy(action);
    const res = await apiFetch(`/api/drafts/${draft.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, text: action === "send" ? text : undefined }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success(action === "send" ? "ส่งแล้ว ✓" : "ข้ามแล้ว");
      onDone();
    } else {
      toast.error("เกิดข้อผิดพลาด");
    }
  }

  return (
    <div className="glass rounded-xl space-y-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <MessageSquare className="size-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">กลุ่ม:</span>
            <span className="text-xs font-semibold text-primary">{draft.group.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            ลูกค้าถาม: <span className="font-medium text-foreground">&ldquo;{draft.sourceMsg}&rdquo;</span>
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {new Date(draft.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-muted-foreground">คำตอบของ AI (แก้ไขได้ก่อนส่ง)</p>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="resize-none text-sm"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          disabled={busy !== null}
          onClick={() => act("skip")}
        >
          <X className="size-4" />
          ข้าม
        </Button>
        <Button
          size="sm"
          disabled={busy !== null || !text.trim()}
          onClick={() => act("send")}
        >
          <Check className="size-4" />
          {busy === "send" ? "กำลังส่ง…" : "ส่งไปกลุ่ม"}
        </Button>
      </div>
    </div>
  );
}

export function DraftsTable({ initialDrafts }: { initialDrafts: Draft[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState(initialDrafts);

  function removeDraft(id: string) {
    setDrafts((d) => d.filter((x) => x.id !== id));
    router.refresh();
  }

  if (drafts.length === 0) {
    return (
      <EmptyState
        title="ไม่มี Draft รอส่ง"
        description="เมื่อ AI สร้างคำตอบในโหมด DRAFT จะแสดงที่นี่"
      />
    );
  }

  return (
    <div className="space-y-4">
      {drafts.map((d) => (
        <DraftCard key={d.id} draft={d} onDone={() => removeDraft(d.id)} />
      ))}
    </div>
  );
}
