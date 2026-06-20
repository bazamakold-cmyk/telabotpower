import type { TicketStatus, Urgency } from "@/lib/tags";

export type { TicketStatus, Urgency };

export type Role = "SUPER_ADMIN" | "MANAGER" | "ADMIN";
export type BotMode = "AUTO_REPLY" | "DRAFT" | "OFF";
export type IngestStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";
export type DocType = "FILE" | "FAQ";

export type User = {
  id: string;
  name: string;
  role: Role;
  username?: string;
  telegramId?: string;
  /** PIN session currently online */
  pinOnline: boolean;
  isActive: boolean;
};

export type TelegramGroup = {
  id: string;
  name: string;
  chatId: string;
  purpose?: string;
  botMode: BotMode;
  collectionIds: string[];
  isActive: boolean;
};

export type KnowledgeCollection = {
  id: string;
  name: string;
  description?: string;
};

export type KnowledgeDoc = {
  id: string;
  collectionId: string;
  type: DocType;
  title: string;
  question?: string;
  answer?: string;
  status: IngestStatus;
};

export type Ticket = {
  id: string;
  group: string;
  admin: string;
  adminOnline: boolean;
  tag: string;
  /** rich-text (HTML) details */
  detail?: string;
  urgency: Urgency;
  status: TicketStatus;
  createdAt: string;
};

export type Kpis = {
  avgResponseMin: number;
  aiQualityScore: number;
  working: number;
  done: number;
};

export type ResponseTrendPoint = { label: string; minutes: number; count: number };
