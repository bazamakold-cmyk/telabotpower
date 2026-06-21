import { db } from "@/lib/db";
import { verifySecret } from "@/lib/hash";

/** True if the PIN already belongs to another user (PINs must be unique to log in). */
export async function isPinTaken(pin: string, exceptUserId?: string): Promise<boolean> {
  const users = await db.user.findMany({ where: { pinHash: { not: null } } });
  for (const u of users) {
    if (u.id === exceptUserId) continue;
    if (u.pinHash && (await verifySecret(pin, u.pinHash))) return true;
  }
  return false;
}
