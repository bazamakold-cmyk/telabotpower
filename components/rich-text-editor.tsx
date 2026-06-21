"use client";

import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { Bold, Italic, List, ListOrdered, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      data-active={active}
      className={cn(
        "grid size-8 place-items-center rounded-md border transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  aiRewrite = false,
}: {
  value: string;
  onChange: (html: string) => void;
  aiRewrite?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: value,
    editorProps: {
      attributes: {
        class:
          "min-h-28 rounded-lg border bg-transparent px-3 py-2 text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1",
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  if (!editor) return null;

  async function rewriteWithAi() {
    if (!editor) return;
    const text = editor.getText().trim();
    if (!text) {
      toast.message("ยังไม่มีข้อความให้เรียบเรียง");
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 700));
    const items = text
      .split(/[\n.]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const html = `<p><strong>รายละเอียด (เรียบเรียงโดย AI)</strong></p><ul>${items
      .map((i) => `<li>${esc(i)}</li>`)
      .join("")}</ul>`;
    editor.commands.setContent(html);
    onChange(editor.getHTML());
    setBusy(false);
    toast.success("เรียบเรียงด้วย AI แล้ว (จำลอง)");
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        <ToolbarButton
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          label="ตัวหนา"
        >
          <Bold className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          label="ตัวเอียง"
        >
          <Italic className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          label="หัวข้อย่อย"
        >
          <List className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          label="ลำดับเลข"
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>

        {aiRewrite && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="ml-auto gap-1.5"
            disabled={busy}
            onClick={rewriteWithAi}
          >
            <Sparkles className="size-4 text-primary" />
            {busy ? "กำลังเรียบเรียง…" : "เรียบเรียงด้วย AI"}
          </Button>
        )}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
