import { z } from "zod";
export const tpoRequestDecisionSchema = z.object({
  confirmed: z.literal(true),
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(2000),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
}).strict().superRefine((value, context) => {
  if (value.action === "REJECT" && value.note.length < 3) {
    context.addIssue({ code: "custom", path: ["note"], message: "Rejection requires a reason" });
  }
});
export function requestDecisionLabel(action: "APPROVE" | "REJECT", requestType: string) {
  return (action === "APPROVE" ? "Approve " : "Reject ") + requestType.replaceAll("_", " ").toLowerCase();
}
