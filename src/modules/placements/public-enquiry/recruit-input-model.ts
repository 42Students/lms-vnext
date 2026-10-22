import { z } from "zod";
import { publicRecruiterWorkEmailSchema } from "../public-college-join-model";
import { normalizedTpoLeadPhoneSchema } from "../tpo-crm-validation";

/** Accept legacy sanitized name (150) and company (200) limits. The
 * public-enquiry snapshot and CRM lead have older, smaller column bounds:
 * write those projections safely and preserve the complete cleaned values in
 * the textual enquiry/audit record rather than discarding input silently. */
function cleanRecruitText(value:string,max:number):string{
 return value.replace(/<[^>]*>/g," ").replace(/[<>\u0000-\u001f\u007f]/g," ")
  .replace(/[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g," ")
  .replace(/\s+/g," ").trim().slice(0,max);
}
export const publicRecruitEnquirySchema=z.strictObject({
 email:publicRecruiterWorkEmailSchema.max(150),code:z.string().regex(/^[0-9]{6}$/),
 name:z.string().max(4096).transform(value=>cleanRecruitText(value,150))
  .refine(value=>value.length>0,"Enter your name"),
 company:z.string().max(4096).transform(value=>cleanRecruitText(value,200)).default(""),
 mobile:normalizedTpoLeadPhoneSchema.optional(),
 hiringFor:z.string().max(8192).transform(value=>cleanRecruitText(value,1000)).optional().default(""),
});
/** Retain legacy TPO CRM activity wording and quoted hiring note.
 * Call with the cleaned, bounded public enquiry fields only. */
export function publicRecruitLeadActivityNote(hiringFor:string,company:string,name:string):string {
 return "Asked to recruit through your placements page"+
   (hiringFor?': "'+hiringFor.slice(0,1000)+'"':"")+
   (company.length>150?" · Full company: "+company:"")+
   (name.length>120?" · Full recruiter name: "+name:"");
}
