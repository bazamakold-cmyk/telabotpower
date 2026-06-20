"use client";

import { SettingsAiTab } from "@/components/settings-ai-tab";
import { SettingsBotTab } from "@/components/settings-bot-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <main className="space-y-6">
      <h1 className="font-display text-2xl font-bold">ตั้งค่า Bot &amp; AI</h1>
      <Tabs defaultValue="bot">
        <TabsList>
          <TabsTrigger value="bot">Bot (Telegram)</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
        </TabsList>
        <TabsContent value="bot" className="mt-4">
          <SettingsBotTab />
        </TabsContent>
        <TabsContent value="ai" className="mt-4">
          <SettingsAiTab />
        </TabsContent>
      </Tabs>
    </main>
  );
}
