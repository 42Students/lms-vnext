import {adminLearningQuerySchema} from "@/modules/courses/admin-learning-read-model";

/** Authenticated admin query strings are still untrusted and can be repeated.
 * The typed shared model accepts numbers, but the browser URL must contain one
 * canonical decimal page and only the filter keys rendered by this directory.
 */
export function parseSuperAdminLearningQuery(
 raw:Record<string,string|string[]|undefined>,
) {
 const allowed=new Set(["q","status","page","courseCode","cohortCode"]);
 if(Object.keys(raw).some(key=>!allowed.has(key)) ||
    Object.values(raw).some(Array.isArray) ||
    (raw.page!==undefined &&
      (typeof raw.page!=="string" || !/^[0-9]+$/.test(raw.page))))
  return adminLearningQuerySchema.safeParse(null);
 return adminLearningQuerySchema.safeParse({
  q:raw.q,status:raw.status,page:raw.page,
  courseCode:raw.courseCode||undefined,
  cohortCode:raw.cohortCode||undefined,
 });
}
