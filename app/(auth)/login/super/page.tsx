"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { OtpInput } from "@/components/otp-input";
import { ParticlePlexus } from "@/components/particle-plexus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SuperLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"cred" | "otp">("cred");
  const [otp, setOtp] = useState("");

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden p-4">
      <ParticlePlexus />
      <div className="glass relative w-full max-w-sm rounded-2xl p-6 shadow-[0_0_40px_-12px_var(--primary)]">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold">Super Admin</h1>
          <p className="text-sm text-muted-foreground">
            {step === "cred" ? "กรอกชื่อผู้ใช้และรหัสผ่าน" : "กรอกรหัส OTP 6 หลัก"}
          </p>
        </div>

        {step === "cred" ? (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setStep("otp");
              toast.message("ส่ง OTP แล้ว (จำลอง) — รหัสคือ 000000");
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="u">ชื่อผู้ใช้</Label>
              <Input id="u" defaultValue="admin147" autoComplete="username" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p">รหัสผ่าน</Label>
              <Input id="p" type="password" required autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full">
              ถัดไป
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <OtpInput value={otp} onChange={setOtp} />
            <Button
              className="w-full"
              onClick={() => {
                toast.success("เข้าสู่ระบบสำเร็จ");
                router.push("/");
              }}
            >
              ยืนยัน
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep("cred")}>
              ย้อนกลับ
            </Button>
          </div>
        )}

        <div className="mt-6 text-center text-sm">
          <Link href="/login" className="text-muted-foreground hover:text-foreground">
            ← เข้าสู่ระบบด้วย PIN
          </Link>
        </div>
      </div>
    </main>
  );
}
