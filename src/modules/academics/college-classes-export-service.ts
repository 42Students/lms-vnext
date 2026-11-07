import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { listCollegeClasses } from "./college-structure-directory-service";
import { collegeClassesExportSchema, renderCollegeClassesCsv, CLASSES_EXPORT_CAP }
  from "./college-classes-export-model";
import { collectCollegeExportRows } from "./college-directory-export-model";

export async function exportCollegeClasses(context: RequestContext, raw: unknown) {
  const query = collegeClassesExportSchema.parse(raw);
  // Reuse the tenant-authorized list service for every page. The caller never
  // supplies collegeId; pagination is only server-authored.
  const result = await collectCollegeExportRows(
    page => listCollegeClasses(context, {...query, page, pageSize: 100}),
    100, CLASSES_EXPORT_CAP,
  );
  return {csv: renderCollegeClassesCsv(result.rows, result.truncated),
    cap: CLASSES_EXPORT_CAP, truncated: result.truncated, exported: result.rows.length};
}
