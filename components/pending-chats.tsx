"use client";

import { AlertCircle, Clock, MessageSquare, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PendingChat = {
  groupId: string;
  groupName: string;
  chatId: string;
  lastMessage: string;
  pendingCount: number;
  waitingSince: string;
};

function waitingLabel(iso: string): { text: string; level: "ok" | "warn" | "danger" } {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 3)  return { text: `${minutes} นาที`, level: "ok" };
  if (minutes < 10) return { text: `${minutes} นาที`, level: "warn" };
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  const text = hours > 0 ? (rem > 0 ? `${hours} ชม. ${rem} นาที` : `${hours} ชั่วโมง`) : `${minutes} นาที`;
  return { text, level: "danger" };
}

function PendingCard({ chat }: { chat: PendingChat }) {
  const wait = waitingLabel(chat.waitingSince);
  return (
    <div className={cn(
      "glass rounded-xl p-4 space-y-3 border-l-4",
      wait.level === "danger" ? "border-l-red-500"
      : wait.level === "warn" ? "border-l-yellow-500"
      : "border-l-emerald-500"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-primary shrink-0" />
          <span className="text-xs text-muted-foreground">กลุ่ม:</span>
          <span className="font-semibold text-primary">{chat.groupName}</span>
          <span className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-bold",
            wait.level === "danger" ? "bg-red-500/15 text-red-400"
            : wait.level === "warn" ? "bg-yellow-500/15 text-yellow-400"
            : "bg-emerald-500/15 text-emerald-400"
          )}>
            {chat.pendingCount} ข้อความ
          </span>
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium shrink-0",
          wait.level === "danger" ? "text-red-400"
          : wait.level === "warn" ? "text-yellow-400"
          : "text-emerald-400"
        )}>
          <Clock className="size-3.5" />
          รอ {wait.text}
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 pl-6">
        &ldquo;{chat.lastMessage}&rdquo;
      </p>
    </div>
  );
}

export function PendingChats({ initial }: { initial: PendingChat[] }) {
  const [chats, setChats] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/pending-chats");
      if (res.ok) {
        setChats(await res.json());
        setLastRefresh(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const t = setInterval(refresh, 60_000);
    return () => clearInterval(t);
  }, [refresh]);

  const danger = chats.filter((c) => waitingLabel(c.waitingSince).level === "danger");
  const warn   = chats.filter((c) => waitingLabel(c.waitingSince).level === "warn");
  const ok     = chats.filter((c) => waitingLabel(c.waitingSince).level === "ok");
  const sorted = [...danger, ...warn, ...ok];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          {danger.length > 0 && (
            <span className="flex items-center gap-1.5 font-medium text-red-400">
              <AlertCircle className="size-4" /> {danger.length} กลุ่มเร่งด่วน
            </span>
          )}
          {warn.length > 0 && (
            <span className="flex items-center gap-1.5 text-yellow-400">
              <Clock className="size-4" /> {warn.length} กลุ่มรอนาน
            </span>
          )}
          {chats.length === 0 && (
            <span className="text-muted-foreground">ทุกกลุ่มได้รับการตอบกลับแล้ว</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            อัปเดต {lastRefresh.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            รีเฟรช
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="ไม่มีแชทค้าง"
          description="ทุกกลุ่มได้รับการตอบกลับเรียบร้อย"
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((c) => <PendingCard key={c.groupId} chat={c} />)}
        </div>
      )}
    </div>
  );
}
