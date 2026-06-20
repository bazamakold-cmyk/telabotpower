import { GroupsManager } from "@/components/groups-manager";
import { getGroups } from "@/lib/services/groups";
import { getCollections } from "@/lib/services/knowledge";

export default async function GroupsPage() {
  const [groups, collections] = await Promise.all([getGroups(), getCollections()]);
  return (
    <main className="space-y-6">
      <h1 className="font-display text-2xl font-bold">ลงทะเบียนกลุ่ม Telegram</h1>
      <GroupsManager initialGroups={groups} collections={collections} />
    </main>
  );
}
