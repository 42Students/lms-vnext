import { z } from "zod";

const id = z.string().uuid();
const email = z.string().trim().toLowerCase().pipe(z.email().max(150));
/**
 * T-S2-02: normalize before applying the legacy 8–10 digit rule.
 * Empty input means no phone; create/update must then require another contact.
 */
export const normalizedTpoLeadPhoneSchema = z.string().trim()
  .max(30)
  .regex(/^\+?[0-9() .-]*$/, "Enter a phone number")
  .transform((value) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return null;
    return digits.length > 10 ? digits.slice(-10) : digits;
  })
  .refine((value) => value === null || (value.length >= 8 && value.length <= 10), {
    message: "Enter a phone number",
  });
const phone = normalizedTpoLeadPhoneSchema;

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
      IMPORT: "IMPORT",
    };
    return synonyms[key] ?? key;
  })
  .pipe(z.enum([
    "ALUMNI", "REFERRAL", "LINKEDIN", "JOB_PORTAL",
    "EVENT", "COLD_OUTREACH", "COMPANY_REACHED_OUT", "IMPORT",
  ],{error:"Choose a source: Alumni, Referral, LinkedIn, Job portal, Event or job fair, Cold outreach, Company reached out, Import."}));

export const createTpoLeadSchema = z.object({
  collegeId: id,
  name: z.string().trim().min(1).max(150),
  email: email.optional(),
  phone: phone.nullable().optional(),
  designation: z.string().trim().max(100).nullable().optional(),
  companyName: z.string().trim().max(150).nullable().optional(),
  source: tpoLeadSourceSchema.optional(),
  followup: z.strictObject({dueAt:z.iso.datetime({offset:true}).refine(value=>new Date(value).getTime()>Date.now(),{
    message:"Choose a future follow-up time"}),note:z.string().trim().max(500).optional()}).optional(),
}).strict().refine(
  value => Boolean(value.email || value.phone),
  "Provide at least an email or phone contact",
);

/** Confirmation belongs to the HTTP boundary, not the reusable service. */
export const confirmedCreateTpoLeadSchema = z.object({
  confirmed: z.literal(true),
  lead: createTpoLeadSchema,
}).strict();

export const logTpoLeadActivitySchema = z.object({
  collegeId: id,
  type: z.enum(["CALL", "EMAIL", "MEETING", "NOTE"]),
  outcome: z.string().trim().max(30).nullable().optional(),
  note: z.string().trim().max(2000).nullable().optional(),
}).strict().superRefine((value,ctx)=>{
  if(value.type==="CALL"&&!["Connected","No answer","Busy","Wrong number","Not interested"].includes(value.outcome??""))
    ctx.addIssue({code:"custom",message:"Choose a call outcome.",path:["outcome"]});
  if(value.type==="NOTE"&&!value.note?.trim())
    ctx.addIssue({code:"custom",message:"Write a note before logging this interaction.",path:["note"]});
});

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

/** Update a recruiter's details without silently clearing omitted contacts. */
export const updateTpoLeadSchema = z.object({
  collegeId: id,
  name: z.string().trim().min(1).max(150).optional(),
  designation: z.string().trim().max(100).nullable().optional(),
  email: email.nullable().optional(),
  phone: phone.nullable().optional(),
  companyName: z.string().trim().min(1).max(150).optional(),
  source: tpoLeadSourceSchema.nullable().optional(),
}).strict().refine(value => Object.keys(value).some(key => key !== "collegeId"), {
  message: "Provide at least one editable field",
});

export const confirmedMarkTpoNotNowSchema = z.object({
  confirmed: z.literal(true),
  decision: markTpoNotNowSchema,
}).strict();

export const checkTpoLeadContactSchema = z.object({
  collegeId: id,
  contact: z.string().trim().min(1).max(150),
}).strict().refine(value => {
  if (value.contact.includes("@")) return email.safeParse(value.contact).success;
  const parsed = phone.safeParse(value.contact);
  return parsed.success && parsed.data !== null;
}, { message: "Provide a valid email address or phone number" });

export type UpdateTpoLeadInput = z.input<typeof updateTpoLeadSchema>;
export type CheckTpoLeadContactInput = z.input<typeof checkTpoLeadContactSchema>;

export type CreateTpoLeadInput = z.input<typeof createTpoLeadSchema>;
export type LogTpoLeadActivityInput = z.input<typeof logTpoLeadActivitySchema>;
export type CreateTpoFollowupInput = z.input<typeof createTpoFollowupSchema>;
export type MoveTpoFollowupInput = z.input<typeof moveTpoFollowupSchema>;
export type MarkTpoNotNowInput = z.input<typeof markTpoNotNowSchema>;
