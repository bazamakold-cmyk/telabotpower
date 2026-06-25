import { KnowledgeManager } from "@/components/knowledge-manager";
import { getCollections, getDocs } from "@/lib/services/knowledge";
import { requireSuperAdmin } from "@/lib/session";

export default async function KnowledgePage() {
  await requireSuperAdmin();
  const [collections, docs] = await Promise.all([getCollections(), getDocs()]);
  return (
    <main className="space-y-6">
      <h1 className="font-display text-2xl font-bold">คลังคู่มือ AI (Knowledge Base)</h1>
      <KnowledgeManager collections={collections} initialDocs={docs} />
    </main>
  );
}
