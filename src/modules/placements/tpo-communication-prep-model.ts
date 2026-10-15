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
