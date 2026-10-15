import { z } from "zod";

export const messagingHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  purpose: z.string().trim().max(160).optional(),
}).strict();

export type MessagingHistoryRow = {
  id: string;
  purpose: string;
  total: number;
  queued: number;
  sent: number;
  failed: number;
  suppressed: number;
  createdAt: Date;
  finalizedAt: Date | null;
};

export function projectMessagingHistory(rows: readonly MessagingHistoryRow[]) {
  return rows.map(row => ({
    id: row.id,
    purpose: row.purpose,
    total: row.total,
    queued: row.queued,
    acceptedByProvider: row.sent,
    failed: row.failed,
    suppressed: row.suppressed,
    createdAt: row.createdAt,
    finalizedAt: row.finalizedAt,
    /** SENT represents provider acceptance, never handset or mailbox delivery. */
    status: row.finalizedAt ? "FINALIZED" as const : "IN_PROGRESS" as const,
  }));
}
