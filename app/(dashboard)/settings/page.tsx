import { SettingsAiTab } from "@/components/settings-ai-tab";
import { SettingsBotTab } from "@/components/settings-bot-tab";
import { SettingsSummaryBotTab } from "@/components/settings-summary-bot-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireSuperAdmin();

  const [bot, aiSetting, summaryBot] = await Promise.all([
    db.botSetting.findUnique({ where: { id: "default" } }),
    db.aiSetting.findUnique({ where: { id: "default" } }),
    db.summaryBotSetting.findUnique({ where: { id: "default" } }),
  ]);

  return (
    <main className="space-y-6">
      <h1 className="font-display text-2xl font-bold">ตั้งค่า Bot &amp; AI</h1>
      <Tabs defaultValue="bot">
        <TabsList>
          <TabsTrigger value="bot">Bot (Telegram)</TabsTrigger>
          <TabsTrigger value="summary-bot">Summary Bot</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
        </TabsList>
        <TabsContent value="bot" className="mt-4">
          <SettingsBotTab
            hasToken={!!bot?.botToken}
            aiAutoReply={bot?.aiAutoReply ?? true}
            webhookUrl={bot?.webhookUrl ?? null}
          />
        </TabsContent>
        <TabsContent value="summary-bot" className="mt-4">
          <SettingsSummaryBotTab
            hasToken={!!summaryBot?.botToken}
            hasChatId={!!summaryBot?.targetGroupChatId}
            savedChatId={summaryBot?.targetGroupChatId ?? null}
            webhookUrl={summaryBot?.webhookUrl ?? null}
          />
        </TabsContent>
        <TabsContent value="ai" className="mt-4">
          <SettingsAiTab
            initialChatModel={aiSetting?.chatModel ?? "claude-sonnet-4-6"}
            initialSystemPrompt={aiSetting?.systemPrompt ?? ""}
            initialThreshold={aiSetting?.autoReplyMinConfidence ?? 0.7}
            initialTopK={aiSetting?.ragTopK ?? 5}
            initialScoring={aiSetting?.scoringEnabled ?? true}
          />
        </TabsContent>
      </Tabs>
    </main>
  );
}
