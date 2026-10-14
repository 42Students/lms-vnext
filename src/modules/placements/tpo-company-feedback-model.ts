import { z } from "zod";

export const tpoCompanyFeedbackQuerySchema = z.object({
  companyId: z.string().uuid(),
  page: z.coerce.number().int().min(1).max(10000).default(1),
}).strict();

export const tpoCompanyFeedbackWriteSchema = z.object({
  leadId: z.string().uuid(),
  note: z.string().trim().min(3).max(2000),
}).strict();

export type TpoCompanyFeedbackFact = {
  id: string;
  leadId: string;
  leadName: string;
  note: string | null;
  at: Date;
};

export function projectTpoCompanyFeedback(
  facts: readonly TpoCompanyFeedbackFact[],
) {
  return facts.filter((fact) => Boolean(fact.note?.trim())).map((fact) => ({
    id: fact.id,
    leadId: fact.leadId,
    contactName: fact.leadName.trim() || "Unnamed contact",
    note: fact.note!.trim(),
    recordedAtIso: fact.at.toISOString(),
  }));
}
