"use client";

import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ALLOWED_EXT = [".txt", ".md"];
const isAllowed = (file: File) =>
  ALLOWED_EXT.some((ext) => file.name.toLowerCase().endsWith(ext));

export function FileDropzone({
  onFiles,
  disabled,
}: {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handle(files: FileList | null) {
    if (disabled || !files || files.length === 0) return;
    const all = Array.from(files);
    const allowed = all.filter(isAllowed);
    const rejected = all.length - allowed.length;
    if (rejected > 0) {
      toast.error(`รองรับเฉพาะไฟล์ .txt และ .md — ข้าม ${rejected} ไฟล์ที่ไม่รองรับ`);
    }
    if (allowed.length > 0) onFiles(allowed);
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled ? "true" : undefined}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handle(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
        disabled
          ? "cursor-not-allowed opacity-50"
          : "cursor-pointer border-border hover:border-primary/50",
        dragging && !disabled && "border-primary bg-primary/5"
      )}
    >
      <UploadCloud className="size-8 text-primary" aria-hidden />
      <p className="text-sm font-medium">
        {disabled ? "กำลังอัปโหลด…" : "ลากและวางไฟล์ที่นี่ หรือคลิกเพื่อเลือก"}
      </p>
      <p className="text-xs text-muted-foreground">รองรับเฉพาะ .txt และ .md</p>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        multiple
        disabled={disabled}
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
    </div>
  );
}
