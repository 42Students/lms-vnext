import {z} from "zod";
export const verifiedParentPhoneSchema=z.string().regex(/^\+[1-9][0-9]{7,14}$/);
export const attendanceParentContactInputSchema=z.object({
 collegeId:z.string().uuid(),membershipId:z.string().uuid(),
 phoneE164:verifiedParentPhoneSchema,
 consentEvidenceReference:z.string().trim().min(8).max(200),
 guardianConsentConfirmed:z.literal(true),verifiedParentPhone:z.literal(true),
}).strict();
export function canNotifyVerifiedParent(contact:{
 phoneE164:string;smsOptIn:boolean;consentAt:Date|null;verifiedAt:Date|null;
 consentEvidenceReference:string|null;
}):boolean{
 return contact.smsOptIn&&verifiedParentPhoneSchema.safeParse(contact.phoneE164).success &&
  contact.consentAt!==null&&contact.verifiedAt!==null&&
  Boolean(contact.consentEvidenceReference?.trim())&&contact.consentEvidenceReference!.trim().length>=8;
}
export type AttendanceParentSmsKind="ABSENT"|"CORRECTED";
function timeIst(date:Date):string{
 return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",hour:"2-digit",minute:"2-digit",
  hour12:true}).format(date);
}
export function attendanceParentSmsBody(kind:AttendanceParentSmsKind,courseName:string,
 startsAt:Date,endsAt:Date):string{
 const safeCourse=courseName.replace(/[\r\n\u0000-\u001f]/g," ").trim().slice(0,80)||"scheduled";
 const span=timeIst(startsAt)+"-"+timeIst(endsAt);
 return kind==="ABSENT"
  ?`Dear Parent, Your ward is absent for today's ${safeCourse} class at ${span}.`
  :`Dear Parent, Your ward's absence for the ${safeCourse} class at ${span} was corrected to present.`;
}
