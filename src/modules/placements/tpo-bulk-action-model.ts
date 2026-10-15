import { z } from "zod";

export const bulkSelectionSchema = z.object({ id: z.string().uuid(), version: z.string().min(1).max(160) }).strict();
export const bulkActionCommandSchema = z.object({
  action: z.string().min(1).max(80),
  selections: z.array(bulkSelectionSchema).min(1).max(200).refine(
    (rows) => new Set(rows.map((row) => row.id)).size === rows.length, "Duplicate records"),
  previewToken: z.string().min(1),
  confirmed: z.literal(true),
}).strict();

export type BulkCandidate = { id: string; version: string; label: string };
export type BulkDecision = { allowed: true } | { allowed: false; reason: string };
export type BulkPreviewRow = BulkCandidate & { status: "ready" | "skipped"; reason: string | null };
export type BulkOutcome = { id: string; status: "updated" | "skipped" | "failed"; reason: string | null; undoVersion?: string };

export function previewBulkAction(rows: readonly BulkCandidate[], decide: (row: BulkCandidate) => BulkDecision): BulkPreviewRow[] {
  const seen = new Set<string>();
  return rows.map((row) => {
    if (seen.has(row.id)) return { ...row, status: "skipped", reason: "Duplicate selection" };
    seen.add(row.id);
    const decision = decide(row);
    return decision.allowed ? { ...row, status: "ready", reason: null } :
      { ...row, status: "skipped", reason: decision.reason };
  });
}
export function countBulkOutcomes(rows: readonly BulkOutcome[]) {
  return {
    updated: rows.filter((row) => row.status === "updated").length,
    skipped: rows.filter((row) => row.status === "skipped").length,
    failed: rows.filter((row) => row.status === "failed").length,
  };
}
export function canExactUndo(change: { id: string; undoVersion?: string }, current: { id: string; version: string } | null) {
  return Boolean(change.undoVersion && current?.id === change.id && current.version === change.undoVersion);
}
