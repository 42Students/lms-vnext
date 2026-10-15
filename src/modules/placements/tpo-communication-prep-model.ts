import { z } from "zod";

export const tpoTemplateKindSchema = z.enum(["BATCH_INVITE", "BATCH_REMINDER", "PREP_FOLLOW_UP"]);
export const TPO_MANUAL_MESSAGE_TEMPLATES = [
  { kind: "BATCH_INVITE", label: "Batch invitation", subject: "Placement participation registration", body: "Placement participation registration for your batch is available. Review the placement portal and record your own choice before the published deadline." },
  { kind: "BATCH_REMINDER", label: "Registration reminder", subject: "Review your placement registration", body: "Please open your placement portal to check your registration choice and the recorded deadline. If you have already made a choice, no further action is required." },
  { kind: "PREP_FOLLOW_UP", label: "Preparation follow-up", subject: "Placement preparation resources", body: "Please review the available preparation courses in your learning portal. Contact the placement cell if you need help accessing relevant resources." },
] as const;
export function getTpoManualMessageTemplate(rawKind: unknown) {
  const kind = tpoTemplateKindSchema.parse(rawKind);
  return TPO_MANUAL_MESSAGE_TEMPLATES.find(item => item.kind === kind)!;
}

export function prepareTpoBatchInvite(input:{batchName:string;deadline:Date|null;invitedAt:Date|null;finishedAt:Date|null}):{subject:string;body:string;warning:string|null}{
 const name=input.batchName.trim();
 const subject="Placement registration — "+name;
 const deadline=input.deadline?new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(input.deadline)+" IST":"no registration deadline recorded";
 const body="The placement cell has prepared registration for "+name+". Check the placement portal and record your own participation choice. Deadline: "+deadline+".";
 const warning=input.finishedAt?"This batch is finished; do not issue a new invitation.":input.invitedAt?"An invitation is already marked in batch lifecycle. This draft does not record or resend it.":null;
 return {subject,body,warning};
}
