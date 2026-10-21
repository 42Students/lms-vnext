import { z } from "zod";

export const messagingHistoryQuerySchema = z.object({
  page: z.coerce.number().int().transform(value=>Math.min(10000,Math.max(1,value))).default(1),
  purpose: z.string().trim().max(64).transform(value=>value||undefined).optional(),
}).strict();

/** No carrier handset-delivery inference may be made from provider acceptance. */
export const MESSAGING_SENT_STATUS_NOTE =
  "SENT means the operator accepted the message. Handset delivery is not reported by the provider.";

/** Human-readable validation for malformed page/purpose filters. Keep strict
 * Zod validation and scoped history queries rather than silently dropping them.
 */
export function messagingHistoryQueryError(input:unknown):string|null {
 const parsed=messagingHistoryQuerySchema.safeParse(input);
 if(parsed.success)return null;
 const fields=parsed.error.issues.map(issue=>issue.path[0]);
 if(fields.includes("page"))return "Enter a valid history page number.";
 if(fields.includes("purpose"))return "Search purpose must be 64 characters or less.";
 return "Invalid history filters. Clear them and try again.";
}

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
    acceptedStatusLabel: "Provider accepted" as const,
    deliveryCaution: MESSAGING_SENT_STATUS_NOTE,
    failed: row.failed,
    suppressed: row.suppressed,
    createdAt: row.createdAt,
    finalizedAt: row.finalizedAt,
    /** SENT represents provider acceptance, never handset or mailbox delivery. */
    status: row.finalizedAt ? "FINALIZED" as const : "IN_PROGRESS" as const,
  }));
}

/** Legacy SMS log size is inclusive 1..200; invalid values never enlarge reads. */
export function legacyMessagingHistoryPaging(rawPage:unknown,rawSize:unknown){
 const numeric=(value:unknown,fallback:number)=>{
  if(value===null||value===undefined||value==="")return fallback;
  const number=Number(value);
  return Number.isFinite(number)?Math.trunc(number):fallback;
 };
 return {page:Math.max(0,Math.min(10000,numeric(rawPage,0))),
  size:Math.max(1,Math.min(200,numeric(rawSize,50)))};
}
