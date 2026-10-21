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
  offerIds: z.array(z.string().uuid()).min(1).max(200,"Verify at most 200 selections at a time").refine(
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
/** A datetime-local control carries no timezone. Interpret it in IST,
 * independent of faculty/TPO browser timezone, and reject date rollover. */
export function parseTpoOfferExpiryIstInput(value:string):string|null{
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))return null;
 const utc=Date.parse(value+":00.000Z");
 if(!Number.isFinite(utc))return null;
 const local=new Date(utc);
 if(local.toISOString().slice(0,16)!==value)return null;
 return new Date(utc-330*60_000).toISOString();
}

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
      // A valid ISSUED offer cannot already have joining history. Corrupted
      // cross-state evidence is not permission to rewrite the official status.
      return status === "ISSUED" && joiningStatus === null;
    case "RECORD_JOINED":
      return status === "ACCEPTED" &&
        (joiningStatus === null || joiningStatus === "PENDING");
    case "WITHDRAW":
      return (status === "ISSUED" && joiningStatus === null) ||
        (status === "ACCEPTED" &&
          (joiningStatus === null || joiningStatus === "PENDING"));
  }
}

/** Legacy selected/verified rows are selection-ledger states rather than
 * premature ISSUED offers. Never invent a released offer for a selection.
 */
export function legacyTpoOfferDisplayStatus(input:{
 offerStatus?:string|null;selectionStatus?:string|null;
 expiresAt?:Date|null;now?:Date;
}):"SELECTED"|"PENDING_VERIFICATION"|"RELEASED"|"ACCEPTED"|"DECLINED"|"EXPIRED"|"WITHDRAWN"|"REVOKED"|"UNKNOWN"{
 if(input.offerStatus==="ACCEPTED")return "ACCEPTED";
 if(input.offerStatus==="DECLINED")return "DECLINED";
 if(input.offerStatus==="WITHDRAWN")return "WITHDRAWN";
 if(input.offerStatus==="REVOKED")return "REVOKED";
 if(input.offerStatus==="ISSUED"){
  const now=input.now??new Date();
  if(input.expiresAt&&input.expiresAt.getTime()<=now.getTime())return "EXPIRED";
  return "RELEASED";
 }
 if(input.selectionStatus==="SELECTED")return "SELECTED";
 if(input.selectionStatus==="PENDING_VERIFICATION")return "PENDING_VERIFICATION";
 if(input.selectionStatus==="VERIFIED")return "PENDING_VERIFICATION";
 if(input.selectionStatus==="RELEASED")return "RELEASED";
 return "UNKNOWN";
}

/** Selection verification uses a distinct operation from offer lifecycle:
 * every result gets its own diagnostic instead of hiding all failures.
 * The actual writer must recheck persisted selection and college scope.
 */
export const tpoBulkVerifySelectionsSchema=z.strictObject({
 confirmed:z.literal(true),
 selectionIds:z.array(z.uuid())
  .min(1,"Choose at least one selection")
  .max(200,"Verify at most 200 selections at a time")
  .refine(ids=>new Set(ids).size===ids.length,"Select distinct selections"),
});
export function tpoVerifySelectionBatch(
 rows:readonly {id:string;status:string;collegeId:string}[],
 collegeId:string,
){
 return rows.map(row=>({
  selectionId:row.id,
  ok:row.collegeId===collegeId&&row.status==="SELECTED",
  error:row.collegeId!==collegeId?"Selection not available in your college":
   row.status!=="SELECTED"?"Only selected candidates can be verified":null,
 }));
}

/** The stored external-import acceptance is provisional. Acceptance cascade
 * cannot mature before the 48-hour dispute window closes and a separate
 * dispute/closure query confirms no challenge remains.
 */
export function externalTpoAcceptanceFinalization(input:{
 channel:string|null;disputableUntil:Date|null;
 disputed:boolean;now:Date;cascadeId:string|null;
}):"NOT_EXTERNAL"|"WAITING_DISPUTE_WINDOW"|"DISPUTED"|"AWAITING_CASCADE"|"FINALIZED"{
 if(input.channel!=="EXTERNAL_IMPORT")return "NOT_EXTERNAL";
 if(input.disputed)return "DISPUTED";
 if(!input.disputableUntil||input.disputableUntil.getTime()>input.now.getTime())
  return "WAITING_DISPUTE_WINDOW";
 return input.cascadeId?"FINALIZED":"AWAITING_CASCADE";
}
