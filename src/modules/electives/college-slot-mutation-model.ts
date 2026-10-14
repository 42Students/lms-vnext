import { z } from "zod";

const title = z.string().trim().min(1).max(150);
const description = z.string().trim().max(1000).nullable();
const pickCounts = {
  credits: z.number().int().min(0).max(30),
  minPick: z.number().int().min(0).max(100),
  maxPick: z.number().int().min(1).max(100),
};

export const createCollegeElectiveSlotSchema = z.object({
  programId: z.string().uuid(),
  academicPeriodId: z.string().uuid().nullable(),
  semesterNumber: z.number().int().min(1).max(12),
  academicYear: z.string().trim().regex(/^\d{4}-(?:\d{2}|\d{4})$/).max(9).nullable(),
  name: title,
  description,
  ...pickCounts,
  confirm: z.literal(true),
}).strict().refine((value) => value.minPick <= value.maxPick, {
  path: ["maxPick"], message: "Maximum picks cannot be below minimum picks",
});

export const editCollegeElectiveSlotSchema = z.object({
  expectedVersion: z.number().int().min(0),
  name: title,
  description,
  ...pickCounts,
  confirm: z.literal(true),
}).strict().refine((value) => value.minPick <= value.maxPick, {
  path: ["maxPick"], message: "Maximum picks cannot be below minimum picks",
});

export function normalizeSlotYear(year: string | null): string | null {
  if (year === null) return null;
  const match = /^(\d{4})-(\d{2}|\d{4})$/.exec(year);
  if (!match) throw new Error("ELECTIVE_YEAR_INVALID");
  const start = Number(match[1]);
  const target = start + 1;
  if (Number(match[2]) !== (match[2].length === 2 ? target % 100 : target)) {
    throw new Error("ELECTIVE_YEAR_INVALID");
  }
  return String(start) + "-" + String(target % 100).padStart(2, "0");
}

export function slotSelectionChanged(
  before: { credits: number; minPick: number; maxPick: number },
  next: { credits: number; minPick: number; maxPick: number },
) {
  return before.credits !== next.credits ||
    before.minPick !== next.minPick || before.maxPick !== next.maxPick;
}
