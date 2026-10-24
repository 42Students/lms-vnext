import "server-only";
import {and,desc,eq,inArray,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents,projectReleases,projectSprints} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {hasActiveMembership,hasMembershipRole} from "@/modules/identity/context";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {listMyProjectInstances} from "./member-service";
import {ProjectsServiceError} from "./errors";
import {parseMentorSprintSignOffSnapshot,type MentorSprintSignOffSnapshot}
 from "./mentor-sprint-signoff-snapshot-model";
import type {MentorRecentCompletedSprint} from "./mentor-consecutive-carry-model";

/** Complete three-most-recent completed sprint IDs for every active assigned
 * Mentor project and their valid latest sign-offs. Do not fabricate missing
 * historical snapshots from the present task assignee or sprint.
 */
export async function getMentorRecentCarryHistory(context:RequestContext):Promise<{
 sprints:MentorRecentCompletedSprint[];snapshots:MentorSprintSignOffSnapshot[];
}>{
 const member=context.membership;
 if(!member||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR")||
   context.user.platformStatus!=="ACTIVE")
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const projects=(await listMyProjectInstances(context))
   .filter(row=>row.memberRole==="MENTOR"&&
      row.project.collegeId===member.collegeId&&row.project.status==="ACTIVE");
 const ids=[...new Set(projects.map(row=>row.project.id))];
 if(!ids.length)return {sprints:[],snapshots:[]};
 // Sprint sequence is release-local. Order every non-deleted project sprint by
 // release and sprint, including ACTIVE/PLANNED slots, before selecting the
 // last three completed records. This prevents "consecutive" false positives
 // across skipped sprints and release boundaries.
 const all=await getDb().select({
   id:projectSprints.id,projectId:projectSprints.projectId,
   sequence:projectSprints.sequence,status:projectSprints.status,
 }).from(projectSprints)
   .innerJoin(projectReleases,and(
     eq(projectReleases.id,projectSprints.releaseId),
     eq(projectReleases.projectId,projectSprints.projectId),
     isNull(projectReleases.deletedAt),
   )).where(and(
     inArray(projectSprints.projectId,ids),
     isNull(projectSprints.deletedAt),
   )).orderBy(desc(projectReleases.sequence),
     desc(projectSprints.sequence),desc(projectSprints.id)).limit(6000);
 const perProject=new Map<string,number>();
 const ordinalByProject=new Map<string,number>();
 const sprints:MentorRecentCompletedSprint[]=all.flatMap(row=>{
   const historyOrdinal=ordinalByProject.get(row.projectId)??0;
   ordinalByProject.set(row.projectId,historyOrdinal+1);
   if(row.status!=="COMPLETED")return [];
   const count=perProject.get(row.projectId)??0;
   if(count>=3)return [];
   perProject.set(row.projectId,count+1);
   return [{id:row.id,projectId:row.projectId,sequence:row.sequence,
     historyOrdinal}];
 });
 if(!sprints.length)return {sprints:[],snapshots:[]};
 const byId=new Map(sprints.map(s=>[s.id,s.projectId] as const));
 const events=await getDb().select({
  subjectId:activityEvents.subjectId,metadata:activityEvents.metadata,
 }).from(activityEvents).where(and(
   eq(activityEvents.module,"PROJECTS"),
   eq(activityEvents.eventType,"projects.sprint.updated"),
   eq(activityEvents.subjectType,"project_sprint"),
   eq(activityEvents.collegeId,member.collegeId),
   eq(activityEvents.organizationId,member.organizationId),
   inArray(activityEvents.subjectId,[...byId.keys()]),
 )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id)).limit(15000);
 const matched=new Set<string>();
 const snapshots:MentorSprintSignOffSnapshot[]=[];
 for(const event of events){
   if(matched.has(event.subjectId))continue;
   const metadata=event.metadata;
   if(!metadata||typeof metadata!=="object"||Array.isArray(metadata)||
      metadata["mentorSignOffSnapshotVersion"]!==1||
      metadata["projectId"]!==byId.get(event.subjectId))continue;
   const parsed=parseMentorSprintSignOffSnapshot(
      metadata["sprintSnapshot"],event.subjectId);
   if(!parsed)continue;
   matched.add(event.subjectId);snapshots.push(parsed);
 }
 return {sprints,snapshots};
}
