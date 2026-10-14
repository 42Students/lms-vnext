import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {listCollegeCourseProgress} from "./college-learning-directory-service";
import {COLLEGE_LEARNING_PAGE_SIZE} from "./college-learning-directory-model";
import {collectCollegeExportRows} from "@/modules/academics/college-directory-export-model";
import {collegeProgressCsvSchema,renderCollegeProgressCsv,PROGRESS_EXPORT_CAP}
 from "./college-progress-export-model";
export async function exportCollegeCourseProgress(context:RequestContext,raw:unknown){
 const query=collegeProgressCsvSchema.parse(raw);
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
  !hasMembershipRole(context,"COLLEGE_ADMIN")||
  !can(context,"courses.read",{collegeId:member.collegeId,organizationId:member.organizationId}))
  throw new AuthorizationError("courses.read");
 requirePermission(context,"courses.read",{collegeId:member.collegeId,organizationId:member.organizationId});
 const result=await collectCollegeExportRows(page=>listCollegeCourseProgress(context,{...query,page}),
  COLLEGE_LEARNING_PAGE_SIZE,PROGRESS_EXPORT_CAP);
 return {...result,csv:renderCollegeProgressCsv(result.rows,result.truncated)};
}
