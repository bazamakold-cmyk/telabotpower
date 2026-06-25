import { ActivityLogTable } from "@/components/activity-log-table";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  await requireSuperAdmin();

  const logs = await db.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { user: { select: { name: true, role: true } } },
  });

  const serialized = logs.map((l) => ({
    id: l.id,
    action: l.action,
    target: l.target,
    detail: l.detail,
    createdAt: l.createdAt.toISOString(),
    user: l.user,
  }));

  return (
    <main className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">บันทึกกิจกรรม</h1>
        <p className="mt-1 text-sm text-muted-foreground">ประวัติการดำเนินการของผู้ใช้ทุกคนในระบบ (500 รายการล่าสุด)</p>
      </div>
      <ActivityLogTable logs={serialized} />
    </main>
  );
}
