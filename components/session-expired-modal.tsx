"use client";

import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SessionExpiredModal({ open }: { open: boolean }) {
  const router = useRouter();
  return (
    <Dialog open={open}>
      <DialogContent className="border-danger/40">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-danger">
            <ShieldAlert className="size-5" aria-hidden /> เซสชันหมดอายุ
          </DialogTitle>
          <DialogDescription>
            เซสชันของคุณหมดอายุ เนื่องจากเข้าสู่ระบบจากอุปกรณ์อื่น
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" onClick={() => router.push("/login")}>
            กลับไปหน้าเข้าสู่ระบบ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
