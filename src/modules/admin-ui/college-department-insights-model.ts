import { z } from "zod";

export const COLLEGE_DEPARTMENT_INSIGHTS_PAGE_SIZE = 25;
export const collegeDepartmentInsightsQuerySchema = z.strictObject({
  q: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export type CollegeDepartmentInsightsQuery = z.infer<typeof collegeDepartmentInsightsQuerySchema>;
export type DepartmentInsightsKind = "ATTENDANCE" | "PLACEMENT_READINESS";

export function departmentInsightsQueryFromSearchParams(
  raw: Record<string, string | string[] | undefined>,
): unknown {
  // Preserve unknown keys and arrays: strict Zod must reject caller-supplied
  // collegeId, duplicate pagination values and unsupported URL controls.
  return Object.fromEntries(
    Object.entries(raw).filter(([, value]) => value !== undefined),
  );
}

export function departmentInsightsPageCount(total: number) {
  return Math.max(1, Math.ceil(total / COLLEGE_DEPARTMENT_INSIGHTS_PAGE_SIZE));
}

export function departmentInsightsHref(
  kind: DepartmentInsightsKind,
  query: CollegeDepartmentInsightsQuery,
) {
  const base = kind === "ATTENDANCE"
    ? "/college/attendance/departments"
    : "/college/placements/readiness-by-department";
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.page > 1) params.set("page", String(query.page));
  return params.size ? base + "?" + params.toString() : base;
}

/** Observed event counts are not learner denominators or attendance rates. */
export function attendanceEvidenceLabel(
  row: { markedSessions: number; recordedRows: number },
) {
  if (row.markedSessions === 0) return "No marked sessions recorded";
  if (row.recordedRows === 0) return "Marked sessions exist; no explicit learner status rows";
  return row.recordedRows + " explicit learner-status records";
}

/** Profile coverage is not placement policy qualification or verified readiness. */
export function readinessEvidenceLabel(
  row: { learners: number; evidenceProfiles: number; verifiedProfiles: number },
) {
  if (row.learners === 0) return "No active enrolled learners recorded";
  return row.evidenceProfiles + " academic evidence profiles (" +
    row.verifiedProfiles + " verified) of " + row.learners +
    " active enrolled learners; eligibility not evaluated";
}
