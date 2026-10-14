import { z } from "zod";
export const adminElectiveQuerySchema = z.strictObject({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "ACTIVE", "ARCHIVED"]).default("ACTIVE"),
});
export type AdminElectiveRow = {
  id: string; name: string; programName: string; semesterNumber: number;
  academicYear: string | null; credits: number; minPick: number;
  maxPick: number; status: string;
};
export function summarizeAdminElectives(rows: readonly AdminElectiveRow[]) {
  return {
    items: rows,
    active: rows.filter(row => row.status === "ACTIVE").length,
    archived: rows.filter(row => row.status === "ARCHIVED").length,
    total: rows.length,
  };
}
