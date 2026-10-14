import { z } from "zod";

export const collegeDepartmentIdSchema = z.string().uuid();
const name = z.string().trim().min(1).max(255);
export const collegeDepartmentCreateSchema = z.object({ name }).strict();
export const collegeDepartmentRenameSchema = z.object({
  name, confirm: z.literal(true),
}).strict();
export const collegeDepartmentArchiveSchema = z.object({ confirm: z.literal(true) }).strict();
export function canArchiveCollegeDepartment(usage: {
  programs: number; courses: number; faculty: number;
}) { return usage.programs === 0 && usage.courses === 0 && usage.faculty === 0; }
