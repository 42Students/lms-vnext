import { z } from "zod";

const id = z.string().uuid();
const email = z.string().trim().toLowerCase().email().max(150);
const phone = z.string().trim()
  .min(7).max(30)
  .regex(/^\+?[0-9() .-]+$/, "Enter a phone number");

export const tpoCrmCollegeIdSchema = id;
export const tpoCrmLeadIdSchema = id;
export const tpoCrmFollowupIdSchema = id;

export const tpoLeadSourceSchema = z.string().trim()
  .min(1).max(30)
  .transform(value => {
    const key = value.toUpperCase().replace(/\s+/g, "_");
    const synonyms: Record<string, string> = {
      ALUMNI: "ALUMNI",
      REFERRAL: "REFERRAL",
      LINKEDIN: "LINKEDIN",
      JOB_PORTAL: "JOB_PORTAL",
      EVENT: "EVENT",
      EVENT_OR_JOB_FAIR: "EVENT",
      COLD_OUTREACH: "COLD_OUTREACH",
      COMPANY_REACHED_OUT: "COMPANY_REACHED_OUT",
    };
    return synonyms[key] ?? key;
  })
  .pipe(z.enum([
    "ALUMNI", "REFERRAL", "LINKEDIN", "JOB_PORTAL",
    "EVENT", "COLD_OUTREACH", "COMPANY_REACHED_OUT",
  ]));

export const createTpoLeadSchema = z.object({
  collegeId: id,
  name: z.string().trim().min(1).max(150),
  email: email.optional(),
  phone: phone.optional(),
  designation: z.string().trim().max(100).nullable().optional(),
  companyName: z.string().trim().max(150).nullable().optional(),
  source: tpoLeadSourceSchema.optional(),
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
