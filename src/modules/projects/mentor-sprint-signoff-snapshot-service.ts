import "server-only";
import {and,desc,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {parseMentorSprintSignOffSnapshot,type MentorSprintSignOffSnapshot}
  from "./mentor-sprint-signoff-snapshot-model";

/** Read only persisted snapshot facts for the currently authorized project.
 * Raw activity metadata is never sent to the UI.
 */
async function listScopedMentorSnapshots(
  context:RequestContext,projectId:string,sprintIds:readonly string[],
  versionKey:"mentorSignOffSnapshotVersion"|"mentorStartSnapshotVersion",
  valueKey:"sprintSnapshot"|"sprintStartSnapshot",
):Promise<MentorSprintSignOffSnapshot[]> {
  const scope=await requireProjectReadAccess(context,projectId);
  if(scope.access!=="MENTOR"||sprintIds.length===0)return [];
  const rows=await getDb().select({
    subjectId:activityEvents.subjectId,
    metadata:activityEvents.metadata,
  }).from(activityEvents).where(and(
    eq(activityEvents.module,"PROJECTS"),
    eq(activityEvents.eventType,ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED),
    eq(activityEvents.subjectType,"project_sprint"),
    eq(activityEvents.collegeId,scope.collegeId),
    eq(activityEvents.organizationId,scope.organizationId),
    inArray(activityEvents.subjectId,[...sprintIds]),
  )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id));
  const seen=new Set<string>();
  const snapshots:MentorSprintSignOffSnapshot[]=[];
  for(const row of rows){
    if(row.metadata["projectId"]!==scope.project.id||
      row.metadata[versionKey]!==1||
      seen.has(row.subjectId))continue;
    seen.add(row.subjectId);
    const parsed=parseMentorSprintSignOffSnapshot(row.metadata[valueKey],row.subjectId);
    if(parsed)snapshots.push(parsed);
  }
  return snapshots;
}

export const listMentorSprintSignOffSnapshots=(
  context:RequestContext,projectId:string,sprintIds:readonly string[],
)=>listScopedMentorSnapshots(context,projectId,sprintIds,
  "mentorSignOffSnapshotVersion","sprintSnapshot");

/** Immutable start-of-sprint planned workload, captured before work begins.
 * For pre-feature sprints this is absent rather than synthesized.
 */
export const listMentorSprintCommitmentSnapshots=(
  context:RequestContext,projectId:string,sprintIds:readonly string[],
)=>listScopedMentorSnapshots(context,projectId,sprintIds,
  "mentorStartSnapshotVersion","sprintStartSnapshot");
