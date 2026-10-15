import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {listLectureHalls} from "./lecture-hall-service";
import {LECTURE_HALLS_EXPORT_CAP,lectureHallsCsvSchema,renderLectureHallsCsv}
 from "./college-lecture-halls-export-model";
export async function exportCollegeLectureHalls(context:RequestContext,raw:unknown){
 const query=lectureHallsCsvSchema.parse(raw);
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
   !hasMembershipRole(context,"COLLEGE_ADMIN")||
   !can(context,"academics.manage",{collegeId:member.collegeId,organizationId:member.organizationId}))
   throw new AuthorizationError("academics.manage");
 requirePermission(context,"academics.manage",{collegeId:member.collegeId,organizationId:member.organizationId});
 const limit=200;
 const filters={
  collegeId:member.collegeId,q:query.q||undefined,
  status:query.status==="ALL"?undefined:query.status,
  roomType:query.roomType==="ALL"?undefined:query.roomType,
  departmentId:query.departmentId,minimumCapacity:query.minimumCapacity,
  maximumCapacity:query.maximumCapacity,
  upcoming:query.upcoming==="ALL"?undefined:query.upcoming,
 };
 const first=await listLectureHalls(context,{...filters,limit,offset:0});
 const rows=[...first.items];
 for(let offset=limit;offset<Math.min(first.pagination.total,LECTURE_HALLS_EXPORT_CAP);offset+=limit){
  const page=await listLectureHalls(context,{...filters,limit,offset});
  rows.push(...page.items);
 }
 const truncated=first.pagination.total>LECTURE_HALLS_EXPORT_CAP;
 return {csv:renderLectureHallsCsv(rows.slice(0,LECTURE_HALLS_EXPORT_CAP),truncated),
  truncated,cap:LECTURE_HALLS_EXPORT_CAP,exported:Math.min(rows.length,LECTURE_HALLS_EXPORT_CAP)};
}
