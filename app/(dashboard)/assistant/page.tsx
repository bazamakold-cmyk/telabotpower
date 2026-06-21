import { AiAssistant } from "@/components/ai-assistant";
import { getCollections } from "@/lib/services/knowledge";

export default async function AssistantPage() {
  const collections = await getCollections();
  return (
    <main className="space-y-6">
      <div>
        <p className="text-xs font-semibold tracking-[0.2em] text-primary">AI ASSISTANT</p>
        <h1 className="font-display text-2xl font-bold">ผู้ช่วย AI</h1>
      </div>
      <AiAssistant collections={collections} />
    </main>
  );
}
