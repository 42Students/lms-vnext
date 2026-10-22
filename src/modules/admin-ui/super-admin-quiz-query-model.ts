import {adminAssessmentQuerySchema} from "@/modules/courses/admin-assessment-directory-model";

/** Old integer IDs are never treated as a college-membership UUID.
 * An authorized migration layer must resolve legacy identifiers via a
 * verified scoped crosswalk before they can become new courseCode filters.
 */
export function parseLegacySuperAdminQuizBookmark(raw:Record<string,string|string[]|undefined>){
 const pick=(key:"collegeId"|"courseId"|"page"|"size")=>{
  const value=raw[key];
  if(value===undefined)return null;
  if(typeof value!=="string"||!/^[1-9][0-9]{0,9}$/.test(value))return false as const;
  const parsed=Number(value);
  return Number.isSafeInteger(parsed)&&parsed>0?parsed:false as const;
 };
 const collegeId=pick("collegeId"),courseId=pick("courseId");
 const page=pick("page"),size=pick("size");
 if([collegeId,courseId,page,size].some(v=>v===false))return null;
 return {collegeId,courseId,page,size};
}

/** Super Admin query params are hostile strings, not trusted internal models.
 * Validate all keys before invoking the shared directory parser (whose numeric
 * coercion is intentionally supported for internal, typed callers).
 */
export function parseSuperAdminQuizQuery(raw:Record<string,string|string[]|undefined>) {
  const allowed=["q","status","courseCode","deliveryId","scope","results","page"];
  if(Object.keys(raw).some(key=>!allowed.includes(key)) ||
     Object.values(raw).some(Array.isArray) ||
     (raw["page"]!==undefined && (typeof raw["page"]!=="string" || !/^[0-9]+$/.test(raw["page"])))) {
    return adminAssessmentQuerySchema.safeParse(null);
  }
  return adminAssessmentQuerySchema.safeParse({
    q:raw["q"],status:raw["status"],courseCode:raw["courseCode"],deliveryId:raw["deliveryId"],
    scope:raw["scope"],results:raw["results"],page:raw["page"],
  });
}


/** Assignment filters share the strict URL boundary. Result-publication filters
 * and CLOSED lifecycle are quiz-only; never silently accept them for assignments.
 */
export function parseSuperAdminAssignmentQuery(raw:Record<string,string|string[]|undefined>) {
  const parsed=parseSuperAdminQuizQuery(raw);
  if(!parsed.success)return parsed;
  if(parsed.data["status"]==="CLOSED" || parsed.data["results"]!=="ALL")
    return adminAssessmentQuerySchema.safeParse(null);
  return parsed;
}
