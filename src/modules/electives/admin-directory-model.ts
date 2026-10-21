import { z } from "zod";
export const adminElectiveQuerySchema = z.strictObject({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  programId: z.string().uuid().optional(),
  semesterNumber: z.coerce.number().int().min(1).max(12).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().refine(n=>n===20||n===50||n===100).default(20),
});
export type AdminElectiveRow = {
  id: string; name: string; programId: string; programName: string; semesterNumber: number;
  academicYear: string | null; credits: number; minPick: number;
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
