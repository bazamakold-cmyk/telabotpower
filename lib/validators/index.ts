import { z } from "zod";

export const userCreateSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่อ"),
  role: z.enum(["SUPER_ADMIN", "MANAGER", "ADMIN"]),
  username: z.string().min(3).optional(),
  telegramId: z.string().optional(),
  pin: z
    .string()
    .regex(/^\d{6}$/, "PIN ต้องเป็นตัวเลข 6 หลัก")
    .optional(),
});

export const groupCreateSchema = z.object({
  name: z.string().min(1),
  chatId: z.string().min(1),
  purpose: z.string().optional(),
  botMode: z.enum(["AUTO_REPLY", "DRAFT", "OFF"]).default("DRAFT"),
  collectionIds: z.array(z.string()).default([]),
});

export const ticketCreateSchema = z.object({
  groupId: z.string().optional(),
  tag: z.string().min(1),
  detail: z.string().optional(),
  urgency: z.enum(["HIGH", "MEDIUM", "NORMAL"]).default("NORMAL"),
  status: z.enum(["RECEIVED", "WORKING", "DONE"]).default("RECEIVED"),
});

export const pinLoginSchema = z.object({
  pin: z.string().regex(/^\d{6}$/),
});

export const superLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type GroupCreateInput = z.infer<typeof groupCreateSchema>;
export type TicketCreateInput = z.infer<typeof ticketCreateSchema>;
