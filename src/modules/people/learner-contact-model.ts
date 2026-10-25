import { z } from "zod";
import { learnerProfileDocumentSchema } from "./profile-validation";

export const learnerContactEditSchema = z.object({
  confirmed: z.literal(true),
  expectedContacts: z.object({
    alternatePhone:z.string().trim().max(32),
    contactEmail:z.string().trim().max(320),
  }).strict().optional(),
  contacts: z.object({
    alternatePhone: z.string().trim().max(32).refine(
      value=>value==="" || (/^[+\d][\d\s-]*$/.test(value) && /^\d{10,15}$/.test(value.replace(/\D/g,""))),
      "Alternate phone number must be 10 to 15 digits",
    ),
    contactEmail: z.string().trim().max(320),
  }).strict(),
}).strict().superRefine((value, ctx) => {
  const checked = learnerProfileDocumentSchema.safeParse({
    contacts: value.contacts,
  });
  if (!checked.success) {
    for (const issue of checked.error.issues) {
      ctx.addIssue({
        code: "custom",
        path: issue.path,
        message: issue.message,
      });
    }
  }
});


/** Canonical primary phone belongs to users.phone_e164 and is read-only in
 * learner profile JSON. Only alternatePhone/contactEmail can be modified.
 * Enforce comparison on the locked, persisted canonical user row, never a
 * primary number supplied by the browser. */
export function validateLearnerAlternatePhoneAgainstPrimary(alternateRaw:string,primaryRaw:string|null){
 const alternate=alternateRaw.trim();
 const primary=(primaryRaw??"").replace(/\D/g,"");
 if(!alternate)return null;
 const digits=alternate.replace(/\D/g,"");
 if(!/^[+\d][\d\s-]*$/.test(alternate)||!/^\d{10,15}$/.test(digits))return "ALTERNATE_PHONE_INVALID" as const;
 if(!primary)return "ALTERNATE_PHONE_PRIMARY_REQUIRED" as const;
 return digits.slice(-10)===primary.slice(-10)
  ? "ALTERNATE_PHONE_SAME_AS_PRIMARY" as const:null;
}

export const LEARNER_CONTACT_FIELD_OWNERSHIP={
 primaryPhone:"Canonical sign-in identity (read-only)",
 alternatePhone:"Learner profile (editable)",
 contactEmail:"Learner profile (editable)",
} as const;

export function learnerContactsAreStale(
  current:{alternatePhone:string;contactEmail:string},
  expected:{alternatePhone:string;contactEmail:string},
){
  return current.alternatePhone!==expected.alternatePhone ||
    current.contactEmail!==expected.contactEmail;
}
