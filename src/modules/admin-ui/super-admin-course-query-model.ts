import {z} from "zod";
import {collegeCourseCatalogueQuerySchema} from "@/modules/courses/college-course-catalogue-model";

/** URL params are attacker-controlled even inside an authenticated Super Admin page.
 * Avoid the shared typed model's intentional numeric coercion for array page
 * values and reject unknown selectors rather than silently ignoring them.
 */
export function parseSuperAdminCourseQuery(
  raw:Record<string,string|string[]|undefined>,
) {
  const keys=new Set(["q","sort","page","pageSize","duplicate","create"]);
  if(Object.keys(raw).some(key=>!keys.has(key)) ||
     Object.values(raw).some(Array.isArray) ||
     (raw.page!==undefined && (typeof raw.page!=="string" || !/^[0-9]+$/.test(raw.page))) ||
     (raw.create!==undefined && raw.create!=="1") ||
     (raw.duplicate!==undefined &&
      (typeof raw.duplicate!=="string" || !z.uuid().safeParse(raw.duplicate).success)))
    return null;

  const parsed=collegeCourseCatalogueQuerySchema.safeParse({
    q:raw.q,sort:raw.sort,page:raw.page,pageSize:raw.pageSize,
  });
  if(!parsed.success)return null;
  return {catalogueQuery:parsed.data,duplicateCourseId:raw.duplicate as string|undefined,openCreateCourse:raw.create==="1"};
}
