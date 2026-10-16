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
