import { z } from "zod";
export const adminElectiveQuerySchema = z.strictObject({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  programId: z.string().uuid().optional(),
  semesterNumber: z.coerce.number().int().min(1).max(12).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().refine(n=>n===20||n===50||n===100).default(20),
});
/** Legacy /slots?programId&semester&includeArchived crosswalk.
 * includeArchived is inclusive (ACTIVE + ARCHIVED), not ARCHIVED-only.
 * The advanced ARCHIVED selector remains available to vNext callers.
 */
const legacySlotFiltersSchema = z.strictObject({
  programId: z.string().uuid().optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  includeArchived: z.boolean().default(false),
});
export function adminElectiveFromLegacyFilters(raw: unknown) {
  const legacy = legacySlotFiltersSchema.parse(raw);
  return adminElectiveQuerySchema.parse({
    programId: legacy.programId,
    semesterNumber: legacy.semester,
    status: legacy.includeArchived ? "ALL" : "ACTIVE",
  });
}

export type AdminElectiveRow = {
  id: string; name: string; programId: string; programName: string; semesterNumber: number;
  academicYear: string | null; hasEnrollmentHistory?:boolean; credits: number; minPick: number;
  maxPick: number; status: string; offerings?: number; students?: number;
};
export function summarizeAdminElectives(rows: readonly AdminElectiveRow[]) {
  return {
    items: rows,
    active: rows.filter(row => row.status === "ACTIVE").length,
    archived: rows.filter(row => row.status === "ARCHIVED").length,
    total: rows.length,
  };
}
