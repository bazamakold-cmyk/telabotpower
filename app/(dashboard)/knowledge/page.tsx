import { KnowledgeManager } from "@/components/knowledge-manager";
import { getCollections, getDocs } from "@/lib/services/knowledge";

export default async function KnowledgePage() {
  const [collections, docs] = await Promise.all([getCollections(), getDocs()]);
  return (
    <main className="space-y-6">
      <h1 className="font-display text-2xl font-bold">คลังคู่มือ AI (Knowledge Base)</h1>
      <KnowledgeManager collections={collections} initialDocs={docs} />
    </main>
  );
}
