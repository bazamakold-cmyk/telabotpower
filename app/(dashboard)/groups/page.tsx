import { GroupsManager } from "@/components/groups-manager";
import { getGroups } from "@/lib/services/groups";
import { getCollections } from "@/lib/services/knowledge";
import { requireAnyRole } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const user = await requireAnyRole();
  const [groups, collections] = await Promise.all([getGroups(), getCollections()]);
  const canEdit = user.role === "SUPER_ADMIN" || user.role === "MANAGER";
  return (
    <main className="space-y-6">
      <h1 className="font-display text-2xl font-bold">ลงทะเบียนกลุ่ม Telegram</h1>
      <GroupsManager initialGroups={groups} collections={collections} canEdit={canEdit} />
    </main>
  );
}
