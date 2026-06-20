"use client";

import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { SessionExpiredModal } from "@/components/session-expired-modal";
import { Button } from "@/components/ui/button";

export function SimulateConcurrent() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <TriangleAlert className="size-4 text-warn" aria-hidden /> จำลอง: เข้าซ้อน
      </Button>
      <SessionExpiredModal open={open} />
    </>
  );
}
