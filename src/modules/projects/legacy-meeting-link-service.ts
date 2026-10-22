import "server-only";

import {and,eq,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {projectMeetings} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";

/** Old deep links name a meeting by an arbitrary project-local key, not by
 * globally meaningful UUID. Resolve only after checking the *current* project
 * role/college and feature flag, including tombstones and cross-tenant misses.
 */
export async function resolveLegacyMeetingKeyLink(
 context:RequestContext,rawProjectId:string,rawKey:string,
):Promise<{meetingId:string;projectId:string;meetingKey:string}>{
 if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
  throw new ProjectsServiceError("PROJECT_MEETING_ACCESS_DENIED");
 const scope=await requireProjectReadAccess(context,rawProjectId);
 const key=rawKey.trim();
 if(!key||key.length>120||key.includes("/")||key.includes("\\")||
    /[\x00-\x1f\x7f]/.test(key))
  throw new ProjectsServiceError("PROJECT_MEETING_NOT_FOUND");
 const candidates=await getDb().select({
  id:projectMeetings.id,meetingKey:projectMeetings.meetingKey,
  status:projectMeetings.status,
 }).from(projectMeetings).where(and(
  eq(projectMeetings.projectId,scope.project.id),
  isNull(projectMeetings.deletedAt),
  sql`lower(${projectMeetings.meetingKey})=lower(${key})`,
 )).limit(2);
 if(candidates.length!==1||!candidates[0]?.meetingKey||
    (scope.access==="LEARNER"&&candidates[0].status==="DRAFT"))
  throw new ProjectsServiceError("PROJECT_MEETING_NOT_FOUND");
 return {meetingId:candidates[0].id,projectId:scope.project.id,
  meetingKey:candidates[0].meetingKey};
}

/** Only a single approved HTTPS/HTTP meeting URL survives import. Historical
 * calendar provider or event IDs are *audit provenance*, not live sync state,
 * and may never be interpreted as URL tokens.
 */
export function importedLegacyMeetingLink(input:{
 meetingUrl:string|null;legacyCalendarEventId:string|null;
 legacyCalendarProvider:string|null;legacyCalendarSyncStatus:string|null;
}):{
 meetingHref:string|null;legacyCalendarEventId:string|null;
 calendarStatus:"RETIRED_NO_SYNC";calendarLabel:string;
}{
 let meetingHref:string|null=null;
 if(input.meetingUrl&&input.meetingUrl.length<=500){
  try{
   const parsed=new URL(input.meetingUrl);
   if((parsed.protocol==="https:"||parsed.protocol==="http:")&&
      parsed.hostname&&!parsed.username&&!parsed.password)
    meetingHref=parsed.toString();
  }catch{/* A malformed historical link cannot become a navigation target. */}
 }
 return {
  meetingHref,
  legacyCalendarEventId:input.legacyCalendarEventId?.slice(0,200)??null,
  calendarStatus:"RETIRED_NO_SYNC",
  calendarLabel:"Calendar integration is not connected. Copy the meeting link to your calendar.",
 };
}

export const projectMeetingLegacyDisplayCopy={
 learnerRequest:"Request meeting",
 mentorSchedule:"Schedule meeting",
 learnerDefaultStatus:"Requested",
 mentorDefaultStatus:"Scheduled",
 meetingStatus:"Meeting status",
 meetingLink:"Meeting link",
 retroDidntGoWell:"What didn't go well?",
 linkedSprintLabel:"Linked sprint",
 reminderRetired:"Automatic meeting reminders are not enabled.",
 calendarRetired:"Calendar integration is not connected.",
 followUpAt:"Follow-up at (IST)",
 followUpStatus:"Follow-up status",
 followUpNotes:"Follow-up notes",
} as const;
