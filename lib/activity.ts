import { db } from "@/lib/db";

export type LogAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE_USER"
  | "UPDATE_USER"
  | "DELETE_USER"
  | "CREATE_GROUP"
  | "UPDATE_GROUP"
  | "DELETE_GROUP"
  | "SEND_DRAFT"
  | "SKIP_DRAFT"
  | "DELETE_TICKET"
  | "CREATE_DOC"
  | "DELETE_DOC"
  | "UPDATE_SETTINGS";

export async function logActivity(
  userId: string,
  action: LogAction,
  target?: string,
  detail?: string,
) {
  try {
    await db.activityLog.create({ data: { userId, action, target, detail } });
  } catch {
    // non-blocking — never let logging break the main flow
  }
}
