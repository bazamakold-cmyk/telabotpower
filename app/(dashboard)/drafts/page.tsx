import { DraftsTable } from "@/components/drafts-table";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DraftsPage() {
  const drafts = await db.aiDraft.findMany({
    where: { status: "PENDING" },
    include: { group: { select: { id: true, name: true, chatId: true } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = drafts.map((d) => ({
    id: d.id,
    sourceMsg: d.sourceMsg,
    draftText: d.draftText,
    createdAt: d.createdAt.toISOString(),
    group: d.group,
  }));

  return (
    <main className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-primary">DRAFT QUEUE</p>
        <h1 className="font-display text-2xl font-bold">
          Draft รอส่ง
          {serialized.length > 0 && (
            <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-sm font-bold text-primary">
              {serialized.length}
            </span>
          )}
        </h1>
      </div>
      <DraftsTable initialDrafts={serialized} />
    </main>
  );
}
