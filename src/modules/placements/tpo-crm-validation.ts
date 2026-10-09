import { z } from "zod";

const id = z.string().uuid();
const email = z.string().trim().toLowerCase().email().max(150);
const phone = z.string().trim()
  .min(7).max(30)
  .regex(/^\+?[0-9() .-]+$/, "Enter a phone number");

export const tpoCrmCollegeIdSchema = id;
export const tpoCrmLeadIdSchema = id;
export const tpoCrmFollowupIdSchema = id;

export const createTpoLeadSchema = z.object({
  collegeId: id,
  name: z.string().trim().min(1).max(150),
  email: email.optional(),
  phone: phone.optional(),
  designation: z.string().trim().max(100).nullable().optional(),
  companyName: z.string().trim().max(150).nullable().optional(),
  source: z.string().trim().max(30).nullable().optional(),
}).strict().refine(
  value => Boolean(value.email || value.phone),
  "Provide at least an email or phone contact",
);

export const logTpoLeadActivitySchema = z.object({
  collegeId: id,
  type: z.enum(["CALL", "WHATSAPP", "EMAIL", "MEETING", "NOTE"]),
  outcome: z.string().trim().max(30).nullable().optional(),
  note: z.string().trim().max(2000).nullable().optional(),
}).strict();

export const createTpoFollowupSchema = z.object({
  collegeId: id,
  dueAt: z.iso.datetime({ offset: true }),
  note: z.string().trim().max(500).nullable().optional(),
}).strict();

export const moveTpoFollowupSchema = z.object({
  collegeId: id,
  dueAt: z.iso.datetime({ offset: true }),
}).strict();

export const markTpoNotNowSchema = z.object({
  collegeId: id,
  reason: z.string().trim().max(255).nullable().optional(),
  revisitDate: z.iso.date().nullable().optional(),
}).strict();

export type CreateTpoLeadInput = z.input<typeof createTpoLeadSchema>;
export type LogTpoLeadActivityInput = z.input<typeof logTpoLeadActivitySchema>;
export type CreateTpoFollowupInput = z.input<typeof createTpoFollowupSchema>;
export type MoveTpoFollowupInput = z.input<typeof moveTpoFollowupSchema>;
export type MarkTpoNotNowInput = z.input<typeof markTpoNotNowSchema>;
