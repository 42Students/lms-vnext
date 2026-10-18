import {adminAssessmentQuerySchema} from "@/modules/courses/admin-assessment-directory-model";

/** Super Admin query params are hostile strings, not trusted internal models.
 * Validate all keys before invoking the shared directory parser (whose numeric
 * coercion is intentionally supported for internal, typed callers).
 */
export function parseSuperAdminQuizQuery(raw:Record<string,string|string[]|undefined>) {
  const allowed=["q","status","courseCode","scope","results","page"];
  if(Object.keys(raw).some(key=>!allowed.includes(key)) ||
     Object.values(raw).some(Array.isArray) ||
     (raw.page!==undefined && (typeof raw.page!=="string" || !/^[0-9]+$/.test(raw.page)))) {
    return adminAssessmentQuerySchema.safeParse(null);
  }
  return adminAssessmentQuerySchema.safeParse({
    q:raw.q,status:raw.status,courseCode:raw.courseCode,
    scope:raw.scope,results:raw.results,page:raw.page,
  });
}


/** Assignment filters share the strict URL boundary. Result-publication filters
 * and CLOSED lifecycle are quiz-only; never silently accept them for assignments.
 */
export function parseSuperAdminAssignmentQuery(raw:Record<string,string|string[]|undefined>) {
  const parsed=parseSuperAdminQuizQuery(raw);
  if(!parsed.success)return parsed;
  if(parsed.data.status==="CLOSED" || parsed.data.results!=="ALL")
    return adminAssessmentQuerySchema.safeParse(null);
  return parsed;
}
