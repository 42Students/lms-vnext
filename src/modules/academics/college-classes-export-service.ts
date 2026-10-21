import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { listCollegeClasses } from "./college-structure-directory-service";
import { collegeClassesExportSchema, renderCollegeClassesCsv }
  from "./college-classes-export-model";

export async function exportCollegeClasses(context: RequestContext, raw: unknown) {
  const query = collegeClassesExportSchema.parse(raw);
  // Reuse the tenant-authorized list service for every page. The caller never
  // supplies collegeId; pagination is only server-authored.
  const first = await listCollegeClasses(context, { ...query, page: 1, pageSize: 100 });
  const rows = [...first.items];
  for (let page = 2; page <= first.totalPages; page++) {
    const next = await listCollegeClasses(context, { ...query, page, pageSize: 100 });
    rows.push(...next.items);
  }
  return { csv: renderCollegeClassesCsv(rows), cap: rows.length,
    truncated: false, exported: rows.length };
}
