import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { listCollegeDepartmentInsights } from "@/modules/admin-ui/college-department-insights-service";
import { departmentAttendanceCsv, departmentAttendanceExportQuerySchema } from "./college-department-csv-model";

const MAX_EXPORT_DEPARTMENTS = 2500;

/** Reuse the authorized, tenant-scoped department evidence aggregation.
 * Fail closed instead of silently truncating a large export.
 */
export async function exportCollegeDepartmentAttendance(context: RequestContext, raw: unknown) {
  const query = departmentAttendanceExportQuerySchema.parse(raw);
  const first = await listCollegeDepartmentInsights(context, "ATTENDANCE", { q: query.q, page: 1 });
  if (first.total > MAX_EXPORT_DEPARTMENTS) {
    throw new Error("DEPARTMENT_ATTENDANCE_EXPORT_TOO_LARGE");
  }
  const records = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await listCollegeDepartmentInsights(context, "ATTENDANCE", {
      q: query.q, page,
    });
    records.push(...next.items);
  }
  if (records.length !== first.total) {
    // Concurrent edits to the department index cannot result in a partial export.
    throw new Error("DEPARTMENT_ATTENDANCE_EXPORT_STALE");
  }
  return { csv: departmentAttendanceCsv(records), rows: records.length };
}
