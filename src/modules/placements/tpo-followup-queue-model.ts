import { z } from "zod";

const uuid = z.string().uuid();
export const tpoFollowupQueueQuerySchema=z.object({scope:z.enum(["TEAM","MINE"]).default("TEAM"),window:z.enum(["DUE","NEXT_7_DAYS"]).default("DUE")}).strict();
export const confirmedTpoFollowupCreateSchema = z.object({
  confirmed: z.literal(true),
  leadId: uuid,
  dueAt: z.iso.datetime({ offset: true }),
  note: z.string().trim().max(500).nullable().optional(),
}).strict();

export const confirmedTpoFollowupDoneSchema = z.object({
  confirmed: z.literal(true),
  expectedDueAt: z.iso.datetime({ offset: true }),
  outcome: z.enum(["CONTACTED", "NO_RESPONSE", "DECLINED", "OTHER"]),
  note: z.string().trim().min(1).max(500),
}).strict();

export const tpoFollowupIdSchema = uuid;

export type TpoDueFollowupFact = {
  id: string;
  leadId: string;
  leadName: string;
  companyName: string | null;
  dueAt: Date;
  note: string | null;
};

export function projectTpoFollowupQueue(
  facts: readonly TpoDueFollowupFact[],
  now: Date,
) {
  const rows = facts.map((fact) => ({
    id: fact.id,
    leadId: fact.leadId,
    leadName: fact.leadName,
    companyName: fact.companyName,
    dueAt: fact.dueAt.toISOString(),
    note: fact.note,
    overdue: fact.dueAt.getTime() < now.getTime(),
  }));
  return { rows, dueCount: rows.filter((row) => row.overdue).length };
}

export function tpoFollowupCreatedAudit(dueAt: Date): string {
  return "Follow-up scheduled for " + dueAt.toISOString();
}

export function tpoFollowupDoneAudit(
  outcome: "CONTACTED" | "NO_RESPONSE" | "DECLINED" | "OTHER",
  note: string,
): string {
  return "Follow-up completed (" + outcome + "): " + note;
}
