import {adminLearningQuerySchema} from "./admin-learning-read-model";

/** Read-only course progress URLs never accept repeated fields or ambiguous
 * numeric page notation. No caller-supplied tenant or organization scope. */
export function parseSuperAdminCourseProgressParams(raw:Record<string,string|string[]|undefined>){
 const allowed=["q","status","page","courseCode","cohortCode"] as const;
 if(Object.keys(raw).some(key=>!allowed.includes(key as typeof allowed[number])))return null;
 if(Object.values(raw).some(Array.isArray))return null;
 if(raw.page!==undefined&&(typeof raw.page!=="string"||!/^[1-9][0-9]*$/.test(raw.page)))
  return null;
 const parsed=adminLearningQuerySchema.safeParse({
  q:raw.q,status:raw.status,page:raw.page,
  courseCode:raw.courseCode||undefined,cohortCode:raw.cohortCode||undefined,
 });
 return parsed.success?parsed.data:null;
}
