import { z } from "zod";
import { templateAssignmentMatchesScope, type TemplateAssignmentReadScope } from "./template-assignment-read-scope";
export const templateCollegeAvailabilityQuerySchema = z.strictObject({
  q: z.string().trim().max(100).default(""),
  status: z.enum(["ALL", "ASSIGNED", "UNASSIGNED"]).default("ALL"),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});
export function projectTemplateCollegeAvailability(
  colleges: readonly { id: string; name: string; code: string; organizationId: string }[],
  assignments: readonly { collegeId: string; assignedVersion: number | null; assignedAt: Date }[],
  rawQuery: unknown,
) {
  const query = templateCollegeAvailabilityQuerySchema.parse(rawQuery);
  const byCollege = new Map(assignments.map(row => [row.collegeId, row]));
  const matching = colleges.map(college => ({ ...college, assignment: byCollege.get(college.id) ?? null }))
    .filter(row => (!query.q || `${row.name} ${row.code}`.toLowerCase().includes(query.q.toLowerCase())) &&
      (query.status === "ALL" || Boolean(row.assignment) === (query.status === "ASSIGNED")))
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const totalPages = Math.max(1, Math.ceil(matching.length / 20));
  const page = Math.min(query.page, totalPages);
  return { query: { ...query, page }, total: matching.length, totalPages,
    items: matching.slice((page - 1) * 20, page * 20) };
}
export function templateCollegeAvailabilityHref(templateId: string, rawQuery: unknown) {
  const id = z.uuid().parse(templateId);
  const query = templateCollegeAvailabilityQuerySchema.parse(rawQuery);
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.status !== "ALL") params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  return `/admin/projects/templates/${id}/colleges` + (params.size ? `?${params}` : "");
}
export function templateAssignmentRevocationNotice() {
  return "This college will no longer be able to create new workspaces from the template. Existing workspaces retain their pinned snapshots.";
}

/** Explicit platform-wide option is only for a centrally verified active
 * Super Admin. Caller must check that role before passing platformWide=true.
 * Default is unchanged: selected admin scope remains restrictive. */
export function templateAvailabilityCollegesInScope<T extends { id: string; organizationId: string }>(
  colleges: readonly T[], scope: TemplateAssignmentReadScope, platformWide=false,
): T[] {
  if(platformWide)return [...colleges];
  return colleges.filter(row => templateAssignmentMatchesScope({ collegeId: row.id, organizationId: row.organizationId }, scope));
}

/** Local search is safe on the already scoped and loaded college page; the
 * server query remains authoritative for cross-page/global matching. */
export function templateCollegeSearchWithinLoaded<T extends {name:string;code:string}>(
 rows:readonly T[],raw:string,
):T[]{
 const needle=raw.trim().toLocaleLowerCase("en-IN").slice(0,100);
 return !needle?[...rows]:rows.filter(row=>
  (row.name+" "+row.code).toLocaleLowerCase("en-IN").includes(needle));
}
