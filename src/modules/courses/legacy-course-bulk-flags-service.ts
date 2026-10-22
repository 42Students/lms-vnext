import "server-only";
import {and,eq,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courses,departments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEvent} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {legacyCourseBulkFlagsSchema} from "./legacy-course-bulk-flags-model";

/** The legacy bulk API has THREE independent nullable fields. The existing
 * Show/Hide from students command additionally propagates lesson visibility;
 * this opt-in command updates only the selected course fields. The old active
 * flag maps to vNext ACTIVE/ARCHIVED lifecycle, not a deletedAt mutation. */
export async function updateLegacyCourseBulkFlags(context:RequestContext,raw:unknown){
 const input=legacyCourseBulkFlagsSchema.parse(raw);
 const acting=await resolveActingCollege(context,"courses.manage");
 const configured=Number(process.env["COURSE_BULK_STATUS_MAX"]??"100");
 const maximum=Number.isSafeInteger(configured)?Math.min(100,Math.max(1,configured)):100;
 if(input.courseIds.length>maximum)
  throw new Error("COURSE_VISIBILITY_BULK_TOO_LARGE");
 const failed:{id:string;reason:string}[]=[];
 let changed=0,unchanged=0;
 for(const id of input.courseIds){
  try{
   const didChange=await getDb().transaction(async tx=>{
    const [current]=await tx.select({
     id:courses.id,status:courses.status,enabled:courses.enabled,
     allowedForDisplay:courses.legacyAllowedForDisplay,version:courses.version,
    }).from(courses)
     .innerJoin(departments,eq(departments.id,courses.departmentId))
     .where(and(eq(courses.id,id),eq(departments.collegeId,acting.collegeId),
      isNull(courses.deletedAt)))
     .for("update",{of:courses}).limit(1);
    if(!current)throw new Error("COURSE_NOT_FOUND");
    await assertPersistedPlatformPermission(tx,context,"courses.manage",{
     collegeId:acting.collegeId,organizationId:acting.organizationId,
    });
    const status=input.active==null?current.status:(input.active?"ACTIVE":"ARCHIVED");
    const enabled=input.enabled??current.enabled;
    const allowedForDisplay=input.allowedForDisplay??current.allowedForDisplay;
    if(status===current.status&&enabled===current.enabled&&
       allowedForDisplay===current.allowedForDisplay)return false;
    const [updated]=await tx.update(courses).set({
     status,enabled,legacyAllowedForDisplay:allowedForDisplay,
     version:sql.raw("version + 1"),updatedAt:new Date(),
    }).where(and(eq(courses.id,id),eq(courses.version,current.version)))
     .returning({id:courses.id});
    if(!updated)throw new Error("COURSE_STALE_VERSION");
    return true;
   });
   if(didChange)changed++;else unchanged++;
  }catch{
   failed.push({id,reason:"Course changed or cannot be updated in the selected college. Refresh and retry."});
  }
 }
 if(changed>0){
  await recordActivityEvent(context,{
   eventType:ACTIVITY_EVENT_TYPES.COURSES_BULK_STATUS_UPDATE,
   collegeId:acting.collegeId,organizationId:acting.organizationId,
   subjectType:"college",subjectId:acting.collegeId,
   subjectLabel:"Course bulk status",
   summary:"Legacy course flags: "+changed+" changed, "+failed.length+" failed",
   metadata:{requested:input.courseIds.length,changed,unchanged,failed:failed.length,
    active:input.active??null,enabled:input.enabled??null,
    allowedForDisplay:input.allowedForDisplay??null,
    operation:"LEGACY_INDEPENDENT_COURSE_FLAGS"},
   groupKey:"college:"+acting.collegeId+":courses",
  });
 }
 return {requested:input.courseIds.length,changed,unchanged,
  failures:failed,failedCount:failed.length,
  operation:"LEGACY_INDEPENDENT_COURSE_FLAGS" as const};
}
