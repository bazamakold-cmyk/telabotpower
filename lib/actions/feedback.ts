"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";

export type LogAnswerInput = {
  collectionId: string;
  collectionName: string;
  question: string;
  answer: string;
  confidence: number;
};

export type LogResult = { ok: true; logId: string } | { ok: false; error: string };
export type RateResult = { ok: true } | { ok: false; error: string };

export async function logAnswer(input: LogAnswerInput): Promise<LogResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "ไม่ได้เข้าสู่ระบบ" };
  const log = await db.answerLog.create({
    data: {
      collectionId: input.collectionId,
      collectionName: input.collectionName,
      question: input.question,
      answer: input.answer,
      confidence: input.confidence,
    },
  });
  return { ok: true, logId: log.id };
}

export async function rateAnswer(logId: string, rating: 1 | -1): Promise<RateResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "ไม่ได้เข้าสู่ระบบ" };
  await db.answerLog.update({ where: { id: logId }, data: { rating } });
  return { ok: true };
}

export async function getFeedbackStats() {
  const [total, thumbsUp, thumbsDown, recent] = await Promise.all([
    db.answerLog.count(),
    db.answerLog.count({ where: { rating: 1 } }),
    db.answerLog.count({ where: { rating: -1 } }),
    db.answerLog.findMany({
      where: { rating: -1 },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, question: true, confidence: true, collectionName: true, createdAt: true },
    }),
  ]);
  return { total, thumbsUp, thumbsDown, recent };
}
