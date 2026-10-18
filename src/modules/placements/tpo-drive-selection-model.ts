import { z } from "zod";

export const recordSelectionsSchema = z.object({
  action: z.literal("RECORD"),
  entries: z.array(z.object({
    applicationId: z.string().uuid(),
    roleTitle: z.string().trim().min(2).max(200),
    annualCtcInr: z.number().int().min(0).max(100_000_000).nullable(),
  }).strict()).min(1).max(100).refine(rows =>
    new Set(rows.map(row => row.applicationId)).size === rows.length,
    "Choose each student only once"),
}).strict();

export const releaseSelectionsSchema = z.object({
  action: z.literal("VERIFY_AND_RELEASE"),
  confirmed: z.literal(true),
  selectionIds: z.array(z.string().uuid()).min(1).max(100),
  expectedRecordedAt: z.record(z.string().uuid(), z.string().datetime({offset:true})),
}).strict().refine(input =>
  new Set(input.selectionIds).size === input.selectionIds.length &&
  input.selectionIds.every(id => Boolean(input.expectedRecordedAt[id])),
  "Each selection needs the original recorded timestamp");

export function summarizeSelectionRelease(rows: readonly { status: "released" | "skipped"; reason?: string }[]) {
  return { released: rows.filter(row => row.status === "released").length,
    skipped: rows.filter(row => row.status === "skipped").length };
}


/** Never return caught database, permission, or internal exception text to a
 * TPO. A multi-selection release can report individual failures to the UI.
 * Safe, bounded outcome copy is essential even if one candidate fails.
 */
export function tpoSelectionReleaseFailureMessage(error: unknown): string {
  if(error instanceof Error && error.message === "PLACEMENT_JOB_PREVIEW_STALE")
    return "This selection changed. Refresh before releasing.";
  return "Could not release this selection. Refresh and try again or contact your administrator.";
}

/** A lost-response retry must not re-record identical selections: it would
 * change recordedAt, invalidate other reviewers' previews, and double-audit.
 * The caller first locks and scopes both job and application rows.
 */
export function isExactTpoSelectionReplay(
  existing: readonly {applicationId:string;roleTitle:string;annualCtcInr:number|null;status:string}[],
  entries: readonly {applicationId:string;roleTitle:string;annualCtcInr:number|null}[],
): boolean {
  // A repeated application cannot constitute a complete replay of a set of
  // persisted selections. Never suppress recording/audit based on duplicates.
  const entryIds = new Set(entries.map(entry=>entry.applicationId));
  const existingIds = new Set(existing.map(row=>row.applicationId));
  return entries.length>0 && entries.length===existing.length &&
    entryIds.size===entries.length && existingIds.size===existing.length &&
    entries.every(entry=>existing.some(row=>row.applicationId===entry.applicationId &&
      row.status==="SELECTED" && row.roleTitle===entry.roleTitle &&
      row.annualCtcInr===entry.annualCtcInr));
}


/** Exact optimistic revision check shared by post-issue settlement and
 * lost-response recovery. Status and official-offer proof are checked separately
 * under the same transaction row lock before marking a selection RELEASED.
 */
export function matchesTpoSelectionReleaseRevision(
  current:{
    recordedAt:Date;applicationId:string;roleTitle:string;annualCtcInr:number|null;
  },
  displayed:{
    applicationId:string;roleTitle:string;annualCtcInr:number|null;
  },
  expectedRecordedAt:string,
):boolean{
  // The API accepts offset-aware ISO dates. A +05:30 token and a Z token
  // for the same instant describe the same persisted revision; textual ISO
  // equality would incorrectly reject a valid, still-current selection.
  const persistedInstant = current.recordedAt.getTime();
  const expectedInstant = Date.parse(expectedRecordedAt);
  return Number.isFinite(persistedInstant) &&
    Number.isFinite(expectedInstant) &&
    persistedInstant === expectedInstant &&
    current.applicationId===displayed.applicationId &&
    current.roleTitle===displayed.roleTitle &&
    current.annualCtcInr===displayed.annualCtcInr;
}
