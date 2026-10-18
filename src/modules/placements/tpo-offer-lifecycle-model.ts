import { z } from "zod";

/**
 * Explicit administrative recording, not learner-impersonation.
 * EXTEND changes expiry only; JOINED is a joining-outcome transition.
 * The registered offer-status enum has no EXTENDED or JOINED value.
 */
export const TPO_OFFER_ACTIONS = [
  "EXTEND", "RECORD_ACCEPTED", "RECORD_DECLINED", "RECORD_JOINED", "WITHDRAW",
] as const;
export type TpoOfferAction = (typeof TPO_OFFER_ACTIONS)[number];

export const tpoOfferLifecycleInputSchema = z.object({
  confirmed: z.literal(true),
  action: z.enum(TPO_OFFER_ACTIONS),
  offerIds: z.array(z.string().uuid()).min(1).max(200).refine(
    (ids) => new Set(ids).size === ids.length,
    "Duplicate offers are not allowed",
  ),
  expectedStatus: z.enum(["ISSUED", "ACCEPTED"]),
  reason: z.string().trim().min(10).max(1200),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).strict().superRefine((v, ctx) => {
  if (v.action === "EXTEND" && !v.expiresAt) {
    ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "New expiry required" });
  }
  if (v.action === "RECORD_JOINED" && !v.joiningDate) {
    ctx.addIssue({ code: "custom", path: ["joiningDate"], message: "Joining date required" });
  }
  if (v.expiresAt && v.action !== "EXTEND") {
    ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "Expiry only applies to EXTEND" });
  }
  if (v.joiningDate && v.action !== "RECORD_JOINED") {
    ctx.addIssue({ code: "custom", path: ["joiningDate"], message: "Joining date only applies to RECORD_JOINED" });
  }
  if (v.joiningDate) {
    const date = new Date(v.joiningDate + "T00:00:00Z");
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== v.joiningDate) {
      ctx.addIssue({ code: "custom", path: ["joiningDate"], message: "Invalid joining date" });
    }
  }
});

/** A TPO records an actual joining, not a scheduled future event.
 * Date-only decisions use the college's IST day, not the server locale.
 */
export function canRecordTpoActualJoiningDate(date: string, now: Date): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(now.getTime())) return false;
  const parsed = new Date(date + "T00:00:00Z");
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return false;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const local = Object.fromEntries(parts.map(part=>[part.type, part.value]));
  return date <= local.year + "-" + local.month + "-" + local.day;
}

export function canRecordTpoOfferAction(
  action: TpoOfferAction,
  status: string,
  joiningStatus: string | null,
): boolean {
  switch (action) {
    case "EXTEND":
    case "RECORD_ACCEPTED":
    case "RECORD_DECLINED":
      return status === "ISSUED";
    case "RECORD_JOINED":
      return status === "ACCEPTED" &&
        (joiningStatus === null || joiningStatus === "PENDING");
    case "WITHDRAW":
      return (status === "ISSUED" || status === "ACCEPTED") &&
        (status !== "ACCEPTED" || joiningStatus === null || joiningStatus === "PENDING");
  }
}
