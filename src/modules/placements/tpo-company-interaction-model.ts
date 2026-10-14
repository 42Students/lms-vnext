import { z } from "zod";

export type TpoCompanyInteractionKind =
  "CALL" | "WHATSAPP" | "EMAIL" | "MEETING" | "NOTE";

export const confirmedTpoCompanyInteractionSchema = z.object({
  confirmed: z.literal(true),
  leadId: z.string().uuid(),
  expectedLeadUpdatedAt: z.iso.datetime({ offset: true }),
  type: z.enum(["CALL", "WHATSAPP", "EMAIL", "MEETING", "NOTE"]),
  outcome: z.string().trim().min(2).max(30).nullable().optional(),
  note: z.string().trim().min(3).max(2000),
}).strict();

export const tpoCompanyInteractionCompanyIdSchema = z.string().uuid();

/** Human input cannot impersonate a DB09 SYSTEM activity or lack meaningful notes. */
export function interactionConfirmationSummary(input: {
  type: "CALL" | "WHATSAPP" | "EMAIL" | "MEETING" | "NOTE";
  contactName: string;
}) {
  return "Record " + input.type.toLowerCase().replaceAll("_", " ") +
    " for " + input.contactName + "? This creates an immutable internal CRM activity; no message is sent.";
}
