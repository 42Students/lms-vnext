import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {listLectureHalls} from "./lecture-hall-service";
import {LECTURE_HALLS_EXPORT_CAP,lectureHallsCsvSchema,renderLectureHallsCsv,renderSuperAdminLectureHallsCsv}
 from "./college-lecture-halls-export-model";
export async function exportCollegeLectureHalls(
 context:RequestContext,raw:unknown,format:"college"|"superadmin"="college",
){
 const query=lectureHallsCsvSchema.parse(raw);
 const actingCollege=await resolveActingCollege(context,"academics.manage");
 const limit=200;
 const filters={
  collegeId:actingCollege.collegeId,q:query.q||undefined,
  status:query.status==="ALL"?undefined:query.status,
  roomType:query.roomType==="ALL"?undefined:query.roomType,
  departmentId:query.departmentId,minimumCapacity:query.minimumCapacity,
  maximumCapacity:query.maximumCapacity,
  upcoming:query.upcoming==="ALL"?undefined:query.upcoming,
 };
 const first=await listLectureHalls(context,{...filters,limit,offset:0});
 const total=first.pagination.total;
 const rows=[...first.items];
 if(!Number.isSafeInteger(total)||total<0||rows.length>limit)
  throw new Error("LECTURE_HALL_EXPORT_STALE");
 for(let offset=limit;offset<Math.min(total,LECTURE_HALLS_EXPORT_CAP);offset+=limit){
  const page=await listLectureHalls(context,{...filters,limit,offset});
  // A changing count or duplicate page must not result in an incomplete,
  // apparently authoritative list of classrooms.
  if(page.pagination.total!==total||page.items.length>limit)
   throw new Error("LECTURE_HALL_EXPORT_STALE");
  rows.push(...page.items);
 }
 const selected=rows.slice(0,LECTURE_HALLS_EXPORT_CAP);
 if(selected.length!==Math.min(total,LECTURE_HALLS_EXPORT_CAP)||
    new Set(selected.map(row=>row.id)).size!==selected.length)
  throw new Error("LECTURE_HALL_EXPORT_STALE");
 const truncated=total>LECTURE_HALLS_EXPORT_CAP;
 return {csv:format==="superadmin"
   ? renderSuperAdminLectureHallsCsv(selected,truncated)
   : renderLectureHallsCsv(selected,truncated),
  truncated,cap:LECTURE_HALLS_EXPORT_CAP,exported:selected.length};
}
