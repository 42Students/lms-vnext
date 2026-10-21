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
/** Legacy edits used primary/secondary contact fields. The canonical lead
 * has one email and one phone, so never silently discard a second value. */
export const tpoLegacyLeadContactSchema=z.strictObject({
 primaryEmail:z.string().trim().optional(),
 secondaryEmail:z.string().trim().optional(),
 primaryPhone:z.string().trim().optional(),
 secondaryPhone:z.string().trim().optional(),
 designation:z.string().trim().max(100).nullable().optional(),
});
export function mapTpoLegacyLeadContacts(raw:unknown){
 const input=tpoLegacyLeadContactSchema.parse(raw);
 const e=[input.primaryEmail,input.secondaryEmail].filter((v):v is string=>Boolean(v?.trim()));
 const phones=[input.primaryPhone,input.secondaryPhone].filter((v):v is string=>Boolean(v?.trim()));
 if(e.length>1&&e[0]!.toLowerCase()!==e[1]!.toLowerCase())
   throw new Error("Review both email addresses before updating the lead");
 if(phones.length>1&&phones[0]!.replace(/\D/g,"")!==phones[1]!.replace(/\D/g,""))
   throw new Error("Review both phone numbers before updating the lead");
 return {email:e[0]?email.parse(e[0]):undefined,
   phone:phones[0]?phone.parse(phones[0]):undefined,
   designation:input.designation};
}


export const tpoCrmCollegeIdSchema = id;
export const tpoCrmLeadIdSchema = id;
export const tpoCrmFollowupIdSchema = id;

/** Old manual dropdown includes seven pickable sources. MANUAL/IMPORT
 * are reserved system provenance and cannot be chosen in the dropdown. */
export const TPO_MANUAL_LEAD_SOURCE_CHOICES=[
 {value:"ALUMNI",label:"Alumni"},
 {value:"REFERRAL",label:"Referral"},
 {value:"LINKEDIN",label:"LinkedIn"},
 {value:"JOB_PORTAL",label:"Job portal"},
 {value:"EVENT",label:"Event or job fair"},
 {value:"COLD_OUTREACH",label:"Cold outreach"},
 {value:"COMPANY_REACHED_OUT",label:"Company reached out"},
] as const;
export const TPO_LEAD_SOURCE_LABELS:Readonly<Record<string,string>>={
 ...Object.fromEntries(TPO_MANUAL_LEAD_SOURCE_CHOICES.map(item=>[item.value,item.label])),
 MANUAL:"Added by hand",IMPORT:"Imported",
};
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
  name: z.string().trim().min(1, "Enter the recruiter's name").max(150),
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
  type: z.enum(["CALL", "EMAIL", "MEETING", "NOTE"],{error:"Log a call, email, meeting or note"}),
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
  dueAt: z.iso.datetime({ offset: true, error:"Choose a date" }),
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


/** Offline historic follow-up reconciliation accepts source-local overdue
 * timestamps only after a trusted user/college identity crosswalk. Manual
 * create controls retain their future-only validation above. */
export const legacyTpoLeadFollowupImportSchema=z.strictObject({
 collegeId:id,
 sourceLeadId:z.number().int().positive(),
 sourceDueAtLocal:z.string().trim().min(10).max(40),
 sourceTimezone:z.literal("Asia/Kolkata"),
 note:z.string().trim().max(500).optional(),
});
export function legacyTpoLeadFollowupInstant(raw:unknown):Date{
 const parsed=legacyTpoLeadFollowupImportSchema.parse(raw);
 // Strict fixed-width source datetime prevents accidental browser-local Date()
 // interpretation. Convert Asia/Kolkata's UTC+05:30 explicitly.
 const match=/^(\d{4}-\d\d-\d\d)[ T](\d\d:\d\d:\d\d)(?:\.\d{1,6})?$/.exec(parsed.sourceDueAtLocal);
 if(!match)throw new Error("Invalid historical follow-up timestamp");
 const instant=new Date(match[1]+"T"+match[2]+"+05:30");
 if(!Number.isFinite(instant.getTime())||instant.toISOString().slice(0,10)<"2000-01-01")
   throw new Error("Invalid historical follow-up timestamp");
 return instant;
}
