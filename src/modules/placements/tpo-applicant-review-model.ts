import { z } from "zod";
export const tpoApplicantReviewSchema = z.object({
  confirmed: z.literal(true),
  expectedUpdatedAt: z.iso.datetime({ offset: true }).transform(value=>new Date(value).toISOString()),
  decision: z.enum(["SHORTLISTED", "REJECTED"]),
  note: z.string().trim().min(10).max(1000),
  internalReason:z.string().trim().min(3).max(500).optional(),
}).strict();
export function canReviewApplicant(status: string, screening: string | null) {
  return status === "SUBMITTED" && (screening === "PENDING" || screening === "HOLD");
}
export function candidateScreeningPayload(input: z.infer<typeof tpoApplicantReviewSchema>) {
  return {
    decision: input.decision,
    candidateMessage: input.decision === "REJECTED" ? input.note : null,
    internalReason: input.decision === "SHORTLISTED" ? input.note : input.internalReason??null,
  };
}
