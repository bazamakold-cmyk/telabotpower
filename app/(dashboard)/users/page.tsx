import { UsersManager } from "@/components/users-manager";
import { getUsers } from "@/lib/services/users";

export default async function UsersPage() {
  const users = await getUsers();
  return (
    <main className="space-y-6">
      <h1 className="font-display text-2xl font-bold">จัดการผู้ใช้ &amp; PIN</h1>
      <UsersManager initialUsers={users} />
    </main>
  );
}
