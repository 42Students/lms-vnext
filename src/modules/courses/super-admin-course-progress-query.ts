import {z} from "zod";
import {adminLearningQuerySchema} from "./admin-learning-read-model";

/** Legacy progress endpoint required separate courseId and classId.
 * A vNext offeringId identifies the scoped course delivery, so we do not
 * accept untrusted legacy numeric IDs as offering UUIDs. These are display
 * messages for missing-field recovery, not weaker query validation. */
export const superAdminCourseProgressLegacyMissingFieldCopy = {
 courseId: "courseId is required",
 classId: "classId is required",
} as const;

export function courseProgressLegacyMissingFieldMessage(field:"courseId"|"classId"){
 return superAdminCourseProgressLegacyMissingFieldCopy[field];
}

/** Read-only course progress URLs never accept repeated fields or ambiguous
 * numeric page notation. No caller-supplied tenant or organization scope. */
export function parseSuperAdminCourseProgressParams(raw:Record<string,string|string[]|undefined>){
 const allowed=["q","status","page","courseCode","cohortCode"] as const;
 if(Object.keys(raw).some(key=>!allowed.includes(key as typeof allowed[number])))return null;
 if(Object.values(raw).some(Array.isArray))return null;
 if(raw.page!==undefined&&(typeof raw.page!=="string"||!/^[1-9][0-9]*$/.test(raw.page)))
  return null;
 // Changing a class invalidates a stale course and result page.
 const cohortCode=raw.cohortCode||undefined;
 const courseCode=cohortCode?(raw.courseCode||undefined):undefined;
 const parsed=adminLearningQuerySchema.safeParse({
  q:raw.q,status:raw.status,page:cohortCode&&courseCode?raw.page:undefined,
  courseCode,cohortCode,
 });
 return parsed.success?parsed.data:null;
}

/** Student progress detail requires one exact offering UUID. Suppress hostile
 * scope keys, malformed UUIDs and duplicate offering IDs before DB access. */
export function parseSuperAdminStudentProgressParams(raw:Record<string,string|string[]|undefined>){
 if(Object.keys(raw).length!==1||typeof raw.offeringId!=="string")return null;
 const parsed=z.string().uuid().safeParse(raw.offeringId);
 return parsed.success?parsed.data:null;
}

/** Legacy numeric courseId/classId cannot be trusted as offering UUIDs.
 * Select the class/course in the current college and use its scoped offering. */
export const superAdminLegacyProgressDeepLink={
 legacyParams:["courseId","classId"],
 migrationPath:"/admin/course-progress",
 error:"Choose a class and course in the selected college to open its offering report.",
} as const;
