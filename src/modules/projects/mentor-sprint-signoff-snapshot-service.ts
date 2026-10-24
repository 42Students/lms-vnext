import "server-only";
import {and,desc,eq,inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {activityEvents} from "@/db/schema";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import type {RequestContext} from "@/modules/identity/context";
import {requireProjectReadAccess} from "./access";
import {latestValidMentorSprintSnapshots,type MentorSprintSignOffSnapshot}
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
    // The event's claimed projectId is not proof that its Sprint belongs to
    // this project. Resolve persisted Sprint ownership (including soft-deleted
    // historical Sprints) before considering a JSON snapshot.
    sql`exists (select 1 from project_sprints ps
      where ps.id::text = ${activityEvents.subjectId}
      and ps.project_id = ${scope.project.id})`,
  )).orderBy(desc(activityEvents.occurredAt),desc(activityEvents.id));
  return latestValidMentorSprintSnapshots(rows,scope.project.id,
    versionKey,valueKey);
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
