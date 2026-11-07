import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { listCollegeDepartmentInsights } from "@/modules/admin-ui/college-department-insights-service";
import { assertDepartmentAttendanceExportComplete, assertDepartmentAttendanceExportPage, departmentAttendanceCsv, departmentAttendanceExportQuerySchema } from "./college-department-csv-model";

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
    assertDepartmentAttendanceExportPage(first, next);
    records.push(...next.items);
  }
  // Detect observed pagination drift and duplicate IDs. A single DB snapshot
  // would be needed to guarantee point-in-time consistency across all pages.
  assertDepartmentAttendanceExportComplete(records, first.total);
  return { csv: departmentAttendanceCsv(records), rows: records.length };
}
