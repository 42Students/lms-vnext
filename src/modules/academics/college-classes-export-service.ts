import "server-only";

import type { RequestContext } from "@/modules/identity/context";
import { listCollegeClasses } from "./college-structure-directory-service";
import { CLASSES_EXPORT_CAP, collegeClassesExportSchema, renderCollegeClassesCsv }
  from "./college-classes-export-model";
import { COLLEGE_STRUCTURE_PAGE_SIZE } from "./college-structure-directory-model";

export async function exportCollegeClasses(context: RequestContext, raw: unknown) {
  const query = collegeClassesExportSchema.parse(raw);
  // Reuse the tenant-authorized list service for every page. The caller never
  // supplies collegeId; pagination is only server-authored.
  const first = await listCollegeClasses(context, { ...query, page: 1 });
  const rows = [...first.items];
  const limitPages = Math.ceil(CLASSES_EXPORT_CAP / COLLEGE_STRUCTURE_PAGE_SIZE);
  for (let page = 2; page <= Math.min(first.totalPages, limitPages); page++) {
    const next = await listCollegeClasses(context, {...query, page});
    rows.push(...next.items);
  }
  const exported = rows.slice(0, CLASSES_EXPORT_CAP);
  const truncated = first.total > CLASSES_EXPORT_CAP;
  return { csv: renderCollegeClassesCsv(exported, truncated),
    cap: CLASSES_EXPORT_CAP, truncated, exported: exported.length };
}
