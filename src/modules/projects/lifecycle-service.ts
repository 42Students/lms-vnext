import { randomUUID } from "node:crypto";
import {z} from "zod";
import {
  and,
  eq,
  ne,
  isNull,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { allowedMentorTaskTransition } from "./mentor-task-transition-model";
import {buildMentorSprintSignOffSnapshot} from "./mentor-sprint-signoff-snapshot-model";
import {isLaterMentorSprint} from "./mentor-sprint-order-model";
import {mentorAtomicNextSprintEligible} from "./mentor-atomic-next-sprint-model";
import {
  projectInstances,
  projectReleases,
  projectSprints,
  projectTasks,
  projectMembers,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  ProjectsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  requireProjectLifecycleMutationAccess,
  requireProjectReadAccess,
} from "./access";
import {
  projectReleaseIdSchema,
  projectReleaseVersionInputSchema,
  projectSprintIdSchema,
  projectTaskIdSchema,
  updateProjectTaskStatusInputSchema,
  type UpdateProjectTaskStatusInput,
} from "./validation";

function mapLifecycleConstraint(error: unknown) {
  if (
    postgresConstraintName(error) ===
    "project_sprints_active_project_uq"
  ) {
    return new ProjectsServiceError(
      "PROJECT_SPRINT_ALREADY_ACTIVE",
    );
  }

  return error;
}

function projectAllowsExecution(status: string) {
  return status !== "ARCHIVED" && status !== "COMPLETED";
}

export async function startProjectSprint(
  context: RequestContext,
  projectIdInput: string,
  sprintIdInput: string,
) {
  const scope =
    await requireProjectLifecycleMutationAccess(
      context,
      projectIdInput,
    );
  const sprintId =
    projectSprintIdSchema.parse(sprintIdInput);
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [project] = await tx
        .select({ status: projectInstances.status })
        .from(projectInstances)
        .where(and(eq(projectInstances.id, scope.project.id),
          eq(projectInstances.collegeId,scope.collegeId)))
        .for("update")
        .limit(1);

      if (!project || !projectAllowsExecution(project.status)) {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_INVALID_STATE",
        );
      }
      await assertPersistedProjectMutationActor(tx,context,scope);

      const [primary] = await tx.select({ id: projectMembers.id })
        .from(projectMembers).where(and(
          eq(projectMembers.projectId, scope.project.id),
          eq(projectMembers.role, "MENTOR"),
          eq(projectMembers.isPrimary, true),
          isNull(projectMembers.endedAt),
        )).limit(1);
      if (!primary) throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");

      const [sprint] = await tx
        .select()
        .from(projectSprints)
        .where(
          and(
            eq(projectSprints.id, sprintId),
            eq(projectSprints.projectId, scope.project.id),
            isNull(projectSprints.deletedAt),
          ),
        )
        .for("update")
        .limit(1);

      if (!sprint) {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_NOT_FOUND",
        );
      }
      if (sprint.status !== "PLANNED") {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_INVALID_STATE",
        );
      }

      const [active] = await tx
        .select({ id: projectSprints.id })
        .from(projectSprints)
        .where(
          and(
            eq(
              projectSprints.projectId,
              scope.project.id,
            ),
            eq(projectSprints.status, "ACTIVE"),
            isNull(projectSprints.deletedAt),
            ne(projectSprints.id, sprint.id),
          ),
        )
        .for("update")
        .limit(1);

      if (active) {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_ALREADY_ACTIVE",
        );
      }

      // Capture the original sprint commitment before the ACTIVE transition.
      // Later additions, re-estimates and NEXT/BACKLOG/DROP dispositions may
      // change current task ownership; this event retains start-time points.
      const commitmentTasks=await tx.select({
        status:projectTasks.status,
        estimatePoints:projectTasks.estimatePoints,
        assigneeMembershipId:projectTasks.assigneeMembershipId,
        carriedFromSprintId:projectTasks.carriedFromSprintId,
      }).from(projectTasks).where(and(
        eq(projectTasks.projectId,scope.project.id),
        eq(projectTasks.sprintId,sprint.id),isNull(projectTasks.deletedAt),
      )).for("update");
      const commitment=buildMentorSprintSignOffSnapshot(sprint.id,commitmentTasks);

      const [started] = await tx
        .update(projectSprints)
        .set({
          status:"ACTIVE",startedAt:new Date(),
          startedByMembershipId:context.membership?.id??null,
          updatedAt:new Date(),
        })
        .where(
          and(
            eq(projectSprints.id, sprint.id),
            eq(projectSprints.status, "PLANNED"),
          ),
        )
        .returning();

      if (!started) {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_INVALID_STATE",
        );
      }

      await tx
        .update(projectReleases)
        .set({
          status: "IN_PROGRESS",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectReleases.id, sprint.releaseId),
            eq(projectReleases.projectId, scope.project.id),
            eq(projectReleases.status, "PLANNED"),
          ),
        );

      await tx
        .update(projectInstances)
        .set({
          status: "ACTIVE",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectInstances.id, scope.project.id),
            eq(projectInstances.status, "PLANNED"),
          ),
        );

      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED,
        collegeId:scope.collegeId,organizationId:scope.organizationId,
        subjectType:"project_sprint",subjectId:sprint.id,subjectLabel:sprint.title,
        summary:"Sprint start-time commitment recorded",
        metadata:{projectId:scope.project.id,sprintId:sprint.id,
          mentorStartSnapshotVersion:1,sprintStartSnapshot:commitment,
          sourceTab:"sprints"},
        groupKey:"project:"+scope.project.id,
      });
      return started;
    });
  } catch (error) {
    if (error instanceof ProjectsServiceError) {
      throw error;
    }
    throw mapLifecycleConstraint(error);
  }
}

export async function completeProjectSprint(
  context: RequestContext,
  projectIdInput: string,
  sprintIdInput: string,
  signOffNote?:string,
  rawDecisions?:readonly {taskId:string;destination:"NEXT"|"BACKLOG"|"DROP";expectedUpdatedAt:string}[],
  nextSprintId?:string,
  startNextSprint=false,
) {
  const note=z.string().trim().max(1000).optional().parse(signOffNote)??"";
  const decisions=z.array(z.strictObject({
    taskId:z.string().uuid(),
    destination:z.enum(["NEXT","BACKLOG","DROP"]),
    expectedUpdatedAt:z.iso.datetime({offset:true}),
  })).max(250).optional().parse(rawDecisions);
  const validatedNext=nextSprintId===undefined?null:z.string().uuid().parse(nextSprintId);
  if(startNextSprint&&!validatedNext)
    throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
  const scope =
    await requireProjectLifecycleMutationAccess(
      context,
      projectIdInput,
    );
  const sprintId =
    projectSprintIdSchema.parse(sprintIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ status: projectInstances.status,deletedAt:projectInstances.deletedAt })
      .from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("update")
      .limit(1);

    if (!project || project.deletedAt || !projectAllowsExecution(project.status)) {
      throw new ProjectsServiceError(
        "PROJECT_SPRINT_INVALID_STATE",
      );
    }
    await assertPersistedProjectMutationActor(tx,context,scope);

    const signOffToken=randomUUID();
    const [sprint] = await tx
      .select()
      .from(projectSprints)
      .where(
        and(
          eq(projectSprints.id, sprintId),
          eq(projectSprints.projectId, scope.project.id),
          isNull(projectSprints.deletedAt),
        ),
      )
      .for("update")
      .limit(1);

    if (!sprint) {
      throw new ProjectsServiceError(
        "PROJECT_SPRINT_NOT_FOUND",
      );
    }
    if (sprint.status !== "ACTIVE") {
      throw new ProjectsServiceError(
        "PROJECT_SPRINT_INVALID_STATE",
      );
    }

    // Preserve workload as it stood at sign-off, before NEXT/BACKLOG/DROP
    // moves alter sprintId or archive unfinished tasks. Lock these rows in
    // the same transaction as the lifecycle and audit write.
    const signOffTasks=await tx.select({
      status:projectTasks.status,
      estimatePoints:projectTasks.estimatePoints,
      assigneeMembershipId:projectTasks.assigneeMembershipId,
      carriedFromSprintId:projectTasks.carriedFromSprintId,
    }).from(projectTasks).where(and(
      eq(projectTasks.projectId,scope.project.id),
      eq(projectTasks.sprintId,sprint.id),
      isNull(projectTasks.deletedAt),
    )).for("update");
    const signOffSnapshot=buildMentorSprintSignOffSnapshot(sprint.id,signOffTasks);
    // This invariant must apply to BOTH the explicit decision workflow and
    // older callers that omit decisions. A submitted task cannot be silently
    // removed from its sprint while its learner submission awaits review.
    if(signOffTasks.some(task=>task.status==="IN_REVIEW"))
      throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");

    const [openTask] = await tx
      .select({ id: projectTasks.id })
      .from(projectTasks)
      .where(
        and(
          eq(projectTasks.projectId, scope.project.id),
          eq(projectTasks.sprintId, sprint.id),
          isNull(projectTasks.deletedAt),ne(projectTasks.status,"DONE"),
        ),
      )
      .for("update")
      .limit(1);

    if(decisions!==undefined){
      // Review decisions and task mutations execute in the same locked sprint
      // transaction as sign-off; a changed task set invalidates the form.
      const unfinished=await tx.select({
        id:projectTasks.id,status:projectTasks.status,
        updatedAt:projectTasks.updatedAt,sequence:projectTasks.sequence,
        carriedFromSprintId:projectTasks.carriedFromSprintId,
        carriedOverAt:projectTasks.carriedOverAt,
      }).from(projectTasks).where(and(
        eq(projectTasks.projectId,scope.project.id),
        eq(projectTasks.sprintId,sprint.id),isNull(projectTasks.deletedAt),
        ne(projectTasks.status,"DONE"),
      )).for("update");
      const byTask=new Map(decisions.map(item=>[item.taskId,item]));
      if(byTask.size!==decisions.length||byTask.size!==unfinished.length||
         unfinished.some(item=>!byTask.has(item.id)||item.status==="IN_REVIEW"||
           item.updatedAt.toISOString()!==byTask.get(item.id)?.expectedUpdatedAt)){
        throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
      }
      const moveNext=decisions.some(item=>item.destination==="NEXT");
      let nextSequence=0;
      if(moveNext){
        if(!validatedNext)throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
        const [nextSprint]=await tx.select({
          id:projectSprints.id,sequence:projectSprints.sequence,
          status:projectSprints.status,releaseId:projectSprints.releaseId,
        }).from(projectSprints).where(and(
          eq(projectSprints.id,validatedNext),
          eq(projectSprints.projectId,scope.project.id),
          isNull(projectSprints.deletedAt),
        )).for("update").limit(1);
        if(!nextSprint||nextSprint.status!=="PLANNED")
          throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
        const [targetRelease]=await tx.select({
          status:projectReleases.status,sequence:projectReleases.sequence,
        }).from(projectReleases).where(and(
          eq(projectReleases.id,nextSprint.releaseId),
          eq(projectReleases.projectId,scope.project.id),
          isNull(projectReleases.deletedAt),
        )).for("update").limit(1);
        const [sourceRelease]=await tx.select({sequence:projectReleases.sequence})
          .from(projectReleases).where(and(
            eq(projectReleases.id,sprint.releaseId),
            eq(projectReleases.projectId,scope.project.id),
            isNull(projectReleases.deletedAt),
          )).limit(1);
        // Release order is project-wide; sprint sequence starts again at zero
        // inside the next release and cannot be compared in isolation.
        if(!targetRelease||targetRelease.status==="SHIPPED"||!sourceRelease||
           !isLaterMentorSprint({
             releaseSequence:sourceRelease.sequence,sprintSequence:sprint.sequence,
           },{
             releaseSequence:targetRelease.sequence,sprintSequence:nextSprint.sequence,
           }))throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
        const [maxSequence]=await tx.select({
          value:sql<number>`coalesce(max(${projectTasks.sequence}),0)::int`,
        }).from(projectTasks).where(eq(projectTasks.sprintId,nextSprint.id));
        nextSequence=maxSequence?.value??0;
      }
      const now=new Date();
      const reversalItems:Array<{
        taskId:string;beforeSequence:number;beforeCarriedFromSprintId:string|null;
        beforeCarriedOverAt:string|null;afterSprintId:string|null;
        afterSequence:number;afterDeletedAt:string|null;afterUpdatedAt:string;
        status:string;
      }>=[];
      for(const item of unfinished){
        const destination=byTask.get(item.id)?.destination;
        if(!destination)throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
        const changes=destination==="NEXT"?{
          sprintId:validatedNext,sequence:++nextSequence,
          carriedFromSprintId:sprint.id,carriedOverAt:now,
          updatedAt:now,updatedByMembershipId:context.membership?.id??null,
        }:destination==="DROP"?{
          sprintId:null,carriedFromSprintId:sprint.id,carriedOverAt:now,
          deletedAt:now,updatedAt:now,
          updatedByMembershipId:context.membership?.id??null,
        }:{
          sprintId:null,carriedFromSprintId:sprint.id,carriedOverAt:now,
          updatedAt:now,updatedByMembershipId:context.membership?.id??null,
        };
        reversalItems.push({
          taskId:item.id,beforeSequence:item.sequence,
          beforeCarriedFromSprintId:item.carriedFromSprintId,
          beforeCarriedOverAt:item.carriedOverAt?.toISOString()??null,
          afterSprintId:destination==="NEXT"?validatedNext:null,
          afterSequence:destination==="NEXT"?nextSequence:item.sequence,
          afterDeletedAt:destination==="DROP"?now.toISOString():null,
          afterUpdatedAt:now.toISOString(),status:item.status,
        });
        const [changed]=await tx.update(projectTasks).set(changes)
          .where(and(eq(projectTasks.id,item.id),
            eq(projectTasks.projectId,scope.project.id),
            eq(projectTasks.sprintId,sprint.id),
            isNull(projectTasks.deletedAt),ne(projectTasks.status,"DONE")))
          .returning({id:projectTasks.id});
        if(!changed)throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
      }
      if(decisions.length){
        const counts={next:decisions.filter(x=>x.destination==="NEXT").length,
          backlog:decisions.filter(x=>x.destination==="BACKLOG").length,
          dropped:decisions.filter(x=>x.destination==="DROP").length};
        await recordActivityEventInTransaction(tx,context,{
          eventType:ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED,
          collegeId:scope.collegeId,organizationId:scope.organizationId,
          subjectType:"project_sprint",subjectId:sprint.id,subjectLabel:sprint.title,
          summary:"Sprint sign-off: "+counts.next+" to next sprint, "+
            counts.backlog+" to backlog, "+counts.dropped+" archived",
          metadata:{projectId:scope.project.id,sprintId:sprint.id,
            ...(validatedNext?{nextSprintId:validatedNext}:{}),
            carryDecisions:decisions,counts,
            carryUndoReceipt:{version:1,signOffToken,sprintId:sprint.id,tasks:reversalItems}},
          groupKey:"project:"+scope.project.id,
        });
      }
    }else if(openTask){
      // Backward compatibility: existing callers still carry all incomplete
      // tasks to the backlog rather than silently dropping them.
      const carried=await tx.update(projectTasks).set({
        sprintId:null,carriedFromSprintId:sprint.id,
        carriedOverAt:new Date(),updatedAt:new Date(),
      }).where(and(eq(projectTasks.projectId,scope.project.id),
        eq(projectTasks.sprintId,sprint.id),isNull(projectTasks.deletedAt),
        ne(projectTasks.status,"DONE"))).returning({id:projectTasks.id});
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED,
        collegeId:scope.collegeId,organizationId:scope.organizationId,
        subjectType:"project_sprint",subjectId:sprint.id,subjectLabel:sprint.title,
        summary:"Unfinished sprint tasks carried to product backlog",
        metadata:{projectId:scope.project.id,sprintId:sprint.id,carriedCount:carried.length},
        groupKey:"project:"+scope.project.id,
      });
    }

    const [completed] = await tx
      .update(projectSprints)
      .set({
        status:"COMPLETED",completedAt:new Date(),
        completedByMembershipId:context.membership?.id??null,
        updatedAt:new Date(),
      })
      .where(
        and(
          eq(projectSprints.id, sprint.id),
          eq(projectSprints.status, "ACTIVE"),
        ),
      )
      .returning();

    if (!completed) {
      throw new ProjectsServiceError(
        "PROJECT_SPRINT_INVALID_STATE",
      );
    }
    // This activity metadata is the immutable read model for historical
    // Mentor workload/points. A reopened-and-signed-off sprint writes a later
    // version; readers select the latest event while status is COMPLETED.
    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_sprint",subjectId:sprint.id,subjectLabel:sprint.title,
      summary:"Sprint sign-off workload recorded",
      metadata:{projectId:scope.project.id,sprintId:sprint.id,
        mentorSignOffSnapshotVersion:1,sprintSnapshot:signOffSnapshot,
        signOffToken,
        sourceTab:"sprints"},
      groupKey:"project:"+scope.project.id,
    });
    if(note){
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED,
        collegeId:scope.collegeId,organizationId:scope.organizationId,
        subjectType:"project_sprint",subjectId:sprint.id,subjectLabel:sprint.title,
        summary:"Mentor sign-off: "+note.slice(0,950),
        metadata:{projectId:scope.project.id,sprintId:sprint.id,
          sourceTab:"sprints",signOffNote:note},
        groupKey:"project:"+scope.project.id,
      });
    }

    if(startNextSprint&&validatedNext){
      // The source Sprint has just completed but is not committed yet.
      // Any failed target authorization, order, release or active-sprint check
      // rolls back all NEXT/BACKLOG/DROP choices, sign-off and audit rows.
      const [primary]=await tx.select({id:projectMembers.id})
        .from(projectMembers).where(and(
          eq(projectMembers.projectId,scope.project.id),
          eq(projectMembers.role,"MENTOR"),
          eq(projectMembers.isPrimary,true),
          isNull(projectMembers.endedAt),
        )).limit(1);
      const [next]=await tx.select({
        id:projectSprints.id,title:projectSprints.title,
        sequence:projectSprints.sequence,status:projectSprints.status,
        releaseId:projectSprints.releaseId,
      }).from(projectSprints).where(and(
        eq(projectSprints.id,validatedNext),
        eq(projectSprints.projectId,scope.project.id),
        isNull(projectSprints.deletedAt),
      )).for("update").limit(1);
      if(!next)throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
      const [sourceRelease]=await tx.select({sequence:projectReleases.sequence})
        .from(projectReleases).where(and(
          eq(projectReleases.id,sprint.releaseId),
          eq(projectReleases.projectId,scope.project.id),
          isNull(projectReleases.deletedAt),
        )).limit(1);
      const [targetRelease]=await tx.select({
        sequence:projectReleases.sequence,status:projectReleases.status,
      }).from(projectReleases).where(and(
        eq(projectReleases.id,next.releaseId),
        eq(projectReleases.projectId,scope.project.id),
        isNull(projectReleases.deletedAt),
      )).for("update").limit(1);
      const [anotherActive]=await tx.select({id:projectSprints.id})
        .from(projectSprints).where(and(
          eq(projectSprints.projectId,scope.project.id),
          eq(projectSprints.status,"ACTIVE"),
          isNull(projectSprints.deletedAt),
        )).for("update").limit(1);
      if(!sourceRelease||!targetRelease||
         !mentorAtomicNextSprintEligible({
           sourceSprintId:sprint.id,targetSprintId:next.id,
           sourceReleaseSequence:sourceRelease.sequence,
           sourceSprintSequence:sprint.sequence,
           targetReleaseSequence:targetRelease.sequence,
           targetSprintSequence:next.sequence,
           targetSprintStatus:next.status,
           targetReleaseStatus:targetRelease.status,
           hasPrimaryMentor:Boolean(primary),
           hasAnotherActiveSprint:Boolean(anotherActive),
         }))throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");

      // This start-time commitment includes tasks just carried NEXT above.
      // Historical planned/done points remain reconstructable after later
      // reassignment and completion, without using mutable task.sprintId.
      const nextTasks=await tx.select({
        status:projectTasks.status,estimatePoints:projectTasks.estimatePoints,
        assigneeMembershipId:projectTasks.assigneeMembershipId,
        carriedFromSprintId:projectTasks.carriedFromSprintId,
      }).from(projectTasks).where(and(
        eq(projectTasks.projectId,scope.project.id),
        eq(projectTasks.sprintId,next.id),
        isNull(projectTasks.deletedAt),
      )).for("update");
      const nextCommitment=buildMentorSprintSignOffSnapshot(next.id,nextTasks);
      const [started]=await tx.update(projectSprints).set({
        status:"ACTIVE",startedAt:new Date(),
        startedByMembershipId:context.membership?.id??null,
        updatedAt:new Date(),
      }).where(and(
        eq(projectSprints.id,next.id),
        eq(projectSprints.projectId,scope.project.id),
        eq(projectSprints.status,"PLANNED"),
      )).returning({id:projectSprints.id});
      if(!started)throw new ProjectsServiceError("PROJECT_SPRINT_INVALID_STATE");
      await tx.update(projectReleases).set({
        status:"IN_PROGRESS",updatedAt:new Date(),
      }).where(and(
        eq(projectReleases.id,next.releaseId),
        eq(projectReleases.projectId,scope.project.id),
        eq(projectReleases.status,"PLANNED"),
      ));
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PROJECTS_SPRINT_UPDATED,
        collegeId:scope.collegeId,organizationId:scope.organizationId,
        subjectType:"project_sprint",subjectId:next.id,subjectLabel:next.title,
        summary:"Sprint start-time commitment recorded",
        metadata:{projectId:scope.project.id,sprintId:next.id,
          mentorStartSnapshotVersion:1,sprintStartSnapshot:nextCommitment,
          sourceTab:"sprints",startedWithSignOffOf:sprint.id},
        groupKey:"project:"+scope.project.id,
      });
    }
    return completed;
  });
}

export async function reopenProjectSprint(
  context: RequestContext,
  projectIdInput: string,
  sprintIdInput: string,
) {
  const scope =
    await requireProjectLifecycleMutationAccess(
      context,
      projectIdInput,
    );
  const sprintId =
    projectSprintIdSchema.parse(sprintIdInput);
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [project] = await tx
        .select({ status: projectInstances.status })
        .from(projectInstances)
        .where(and(eq(projectInstances.id, scope.project.id),
          eq(projectInstances.collegeId,scope.collegeId)))
        .for("update")
        .limit(1);

      if (!project || !projectAllowsExecution(project.status)) {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_INVALID_STATE",
        );
      }
      await assertPersistedProjectMutationActor(tx,context,scope);

      const [sprint] = await tx
        .select()
        .from(projectSprints)
        .where(
          and(
            eq(projectSprints.id, sprintId),
            eq(projectSprints.projectId, scope.project.id),
            isNull(projectSprints.deletedAt),
          ),
        )
        .for("update")
        .limit(1);

      if (!sprint) {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_NOT_FOUND",
        );
      }
      if (sprint.status !== "COMPLETED") {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_INVALID_STATE",
        );
      }

      const [release] = await tx
        .select({ status: projectReleases.status })
        .from(projectReleases)
        .where(
          and(
            eq(projectReleases.id, sprint.releaseId),
            eq(projectReleases.projectId, scope.project.id),
          ),
        )
        .for("update")
        .limit(1);

      if (!release || release.status === "SHIPPED") {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_INVALID_STATE",
        );
      }

      const [activeSibling] = await tx
        .select({ id: projectSprints.id })
        .from(projectSprints)
        .where(
          and(
            eq(projectSprints.projectId, scope.project.id),
            eq(projectSprints.status, "ACTIVE"),
            isNull(projectSprints.deletedAt),
            ne(projectSprints.id, sprint.id),
          ),
        )
        .for("update")
        .limit(1);

      if (activeSibling) {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_ALREADY_ACTIVE",
        );
      }

      const [reopened] = await tx
        .update(projectSprints)
        .set({
          status:"ACTIVE",startedAt:new Date(),
          startedByMembershipId:context.membership?.id??null,
          completedAt:null,completedByMembershipId:null,
          updatedAt:new Date(),
        })
        .where(
          and(
            eq(projectSprints.id, sprint.id),
            eq(projectSprints.status, "COMPLETED"),
          ),
        )
        .returning();

      if (!reopened) {
        throw new ProjectsServiceError(
          "PROJECT_SPRINT_INVALID_STATE",
        );
      }

      await tx
        .update(projectReleases)
        .set({
          status: "IN_PROGRESS",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectReleases.id, sprint.releaseId),
            ne(projectReleases.status, "SHIPPED"),
          ),
        );

      await tx
        .update(projectInstances)
        .set({
          status: "ACTIVE",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectInstances.id, scope.project.id),
            ne(projectInstances.status, "ARCHIVED"),
          ),
        );

      return reopened;
    });
  } catch (error) {
    if (error instanceof ProjectsServiceError) {
      throw error;
    }
    throw mapLifecycleConstraint(error);
  }
}

export async function updateProjectTaskStatus(
  context: RequestContext,
  projectIdInput: string,
  taskIdInput: string,
  rawInput: UpdateProjectTaskStatusInput,
) {
  const scope = await requireProjectLifecycleMutationAccess(context, projectIdInput);
  const input = updateProjectTaskStatusInputSchema.parse(rawInput);
  const taskId = projectTaskIdSchema.parse(taskIdInput);

  return getDb().transaction(async (tx) => {
    const [project] = await tx.select({ status: projectInstances.status })
      .from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("update").limit(1);
    if (!project || !projectAllowsExecution(project.status)) {
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    }
    await assertPersistedProjectMutationActor(tx,context,scope);

    // Read inside the transaction; the sprint lock and task recheck protect
    // against concurrently moving or completing a task.
    const [candidate] = await tx.select({ sprintId: projectTasks.sprintId })
      .from(projectTasks)
      .where(and(eq(projectTasks.id, taskId), eq(projectTasks.projectId, scope.project.id)))
      .limit(1);
    if (!candidate) throw new ProjectsServiceError("PROJECT_TASK_NOT_FOUND");
    if (candidate.sprintId === null) throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");

    const [sprint] = await tx.select({ status: projectSprints.status })
      .from(projectSprints)
      .where(and(eq(projectSprints.id, candidate.sprintId), eq(projectSprints.projectId, scope.project.id),
        isNull(projectSprints.deletedAt)))
      .for("update").limit(1);
    if (!sprint || sprint.status !== "ACTIVE") {
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    }

    const [lockedTask] = await tx.select()
      .from(projectTasks)
      .where(and(eq(projectTasks.id, taskId), eq(projectTasks.projectId, scope.project.id)))
      .for("update").limit(1);
    if (!lockedTask || lockedTask.sprintId !== candidate.sprintId ||
        !allowedMentorTaskTransition(lockedTask.status, input.status) ||
        lockedTask.updatedAt.getTime() !== new Date(input.expectedUpdatedAt).getTime()) {
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    }

    // 0090: entering BLOCKED requires a persisted blocker reason.
    if (input.status==="BLOCKED" && !lockedTask.blockerReason?.trim())
      throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");
    const now = new Date(Math.max(Date.now(), lockedTask.updatedAt.getTime() + 1));
    const [updated] = await tx.update(projectTasks).set({
      status: input.status,
      updatedAt: now,
    }).where(and(
      eq(projectTasks.id, lockedTask.id),
      eq(projectTasks.projectId, scope.project.id),
      eq(projectTasks.status, lockedTask.status),
      sql`date_trunc('milliseconds', ${projectTasks.updatedAt}) = ${new Date(input.expectedUpdatedAt).toISOString()}::timestamptz`,
    )).returning();
    if (!updated) throw new ProjectsServiceError("PROJECT_TASK_INVALID_STATE");

    await recordActivityEventInTransaction(tx, context, {
      eventType: ACTIVITY_EVENT_TYPES.PROJECTS_TASK_STATUS_CHANGED,
      collegeId: scope.collegeId,
      organizationId: scope.organizationId,
      subjectType: "project_task",
      subjectId: updated.id,
      subjectLabel: updated.title,
      summary: "Project task status changed",
      metadata: {
        projectId: scope.project.id,
        taskId: updated.id,
        previousStatus: lockedTask.status,
        nextStatus: updated.status,
        reviewRequiredForDone: true,
      },
      groupKey: "project:" + scope.project.id,
      dedupeKey: "project-task:" + updated.id + ":status:" + randomUUID(),
    });
    return updated;
  });
}

export async function unshipProjectRelease(
  context: RequestContext,
  projectIdInput: string,
  releaseIdInput: string,
  rawInput:unknown={},
) {
  const scope =
    await requireProjectLifecycleMutationAccess(
      context,
      projectIdInput,
    );
  const expected=projectReleaseVersionInputSchema.parse(rawInput).expectedUpdatedAt;
  if(scope.access==="MENTOR"&&!expected)throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
  const releaseId =
    projectReleaseIdSchema.parse(releaseIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ status: projectInstances.status,deletedAt:projectInstances.deletedAt })
      .from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("update")
      .limit(1);

    if (!project || project.deletedAt || project.status === "ARCHIVED") {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_INVALID_STATE",
      );
    }
    await assertPersistedProjectMutationActor(tx,context,scope);

    const [release] = await tx
      .select()
      .from(projectReleases)
      .where(
        and(
          eq(projectReleases.id, releaseId),
          eq(projectReleases.projectId, scope.project.id),
            isNull(projectReleases.deletedAt),
        ),
      )
      .for("update")
      .limit(1);

    if (!release) {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_NOT_FOUND",
      );
    }
    if(expected && release.updatedAt.getTime()!==new Date(expected).getTime())
      throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
    if (release.status !== "SHIPPED") {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_INVALID_STATE",
      );
    }

    const [startedSprint] = await tx
      .select({ id: projectSprints.id })
      .from(projectSprints)
      .where(
        and(
          eq(projectSprints.projectId, scope.project.id),
          eq(projectSprints.releaseId, release.id),
          isNull(projectSprints.deletedAt),
          ne(projectSprints.status, "PLANNED"),
        ),
      )
      .for("update")
      .limit(1);

    const nextStatus =
      startedSprint ? "IN_PROGRESS" : "PLANNED";

    const [unshipped] = await tx
      .update(projectReleases)
      .set({
        status: nextStatus,
        updatedAt: new Date(Math.max(Date.now(),release.updatedAt.getTime()+1)),
        version:sql`${projectReleases.version} + 1`,
      })
      .where(
        and(
          eq(projectReleases.id, release.id),
          eq(projectReleases.projectId, scope.project.id),
          eq(projectReleases.status, "SHIPPED"),
        ),
      )
      .returning();

    if (!unshipped) {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_INVALID_STATE",
      );
    }

    await tx
      .update(projectInstances)
      .set({
        status: "ACTIVE",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(projectInstances.id, scope.project.id),
          eq(projectInstances.status, "COMPLETED"),
        ),
      );

    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_RELEASE_UPDATED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_release",subjectId:unshipped.id,subjectLabel:unshipped.title,
      summary:"Project release un-shipped",
      metadata:{projectId:scope.project.id,releaseId:unshipped.id,
        releaseKey:unshipped.templateKey,sourceTab:"sprints",
        change:"UNSHIPPED",from:release.status,to:unshipped.status,
        previousVersion:release.version,version:unshipped.version,
        previousUpdatedAt:release.updatedAt.toISOString(),
        updatedAt:unshipped.updatedAt.toISOString()},
      groupKey:"project:"+scope.project.id,
    });
    return unshipped;
  });
}

export async function shipProjectRelease(
  context: RequestContext,
  projectIdInput: string,
  releaseIdInput: string,
  rawInput:unknown={},
) {
  const scope =
    await requireProjectLifecycleMutationAccess(
      context,
      projectIdInput,
    );
  const expected=projectReleaseVersionInputSchema.parse(rawInput).expectedUpdatedAt;
  if(scope.access==="MENTOR"&&!expected)throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
  const releaseId =
    projectReleaseIdSchema.parse(releaseIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ status: projectInstances.status,deletedAt:projectInstances.deletedAt })
      .from(projectInstances)
      .where(and(eq(projectInstances.id, scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("update")
      .limit(1);

    if (!project || project.deletedAt || !projectAllowsExecution(project.status)) {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_INVALID_STATE",
      );
    }
    await assertPersistedProjectMutationActor(tx,context,scope);

    const [release] = await tx
      .select()
      .from(projectReleases)
      .where(
        and(
          eq(projectReleases.id, releaseId),
          eq(projectReleases.projectId, scope.project.id),
            isNull(projectReleases.deletedAt),
        ),
      )
      .for("update")
      .limit(1);

    if (!release) {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_NOT_FOUND",
      );
    }
    if(expected && release.updatedAt.getTime()!==new Date(expected).getTime())
      throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
    if (
      release.status !== "PLANNED" &&
      release.status !== "IN_PROGRESS"
    ) {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_INVALID_STATE",
      );
    }

    // A planned release with zero sprints cannot be shipped as completed work.
    const [firstSprint] = await tx
      .select({ id: projectSprints.id })
      .from(projectSprints)
      .where(and(
        eq(projectSprints.projectId, scope.project.id),
        eq(projectSprints.releaseId, release.id),
      isNull(projectSprints.deletedAt),
      ))
      .limit(1);
    if (!firstSprint) {
      throw new ProjectsServiceError("PROJECT_RELEASE_INVALID_STATE");
    }

    const [openSprint] = await tx
      .select({ id: projectSprints.id })
      .from(projectSprints)
      .where(
        and(
          eq(projectSprints.projectId, scope.project.id),
          eq(projectSprints.releaseId, release.id),
          isNull(projectSprints.deletedAt),
          ne(projectSprints.status, "COMPLETED"),
        ),
      )
      .for("update")
      .limit(1);

    if (openSprint) {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_HAS_OPEN_SPRINTS",
      );
    }

    const [shipped] = await tx
      .update(projectReleases)
      .set({
        status: "SHIPPED",
        updatedAt: new Date(Math.max(Date.now(),release.updatedAt.getTime()+1)),
        version:sql`${projectReleases.version} + 1`,
      })
      .where(
        and(
          eq(projectReleases.id, release.id),
          eq(projectReleases.projectId, scope.project.id),
          eq(projectReleases.status, release.status),
        ),
      )
      .returning();

    if (!shipped) {
      throw new ProjectsServiceError(
        "PROJECT_RELEASE_INVALID_STATE",
      );
    }

    // Shipping finishes the release; only the approved mentor closeout
    // workflow may transition the project to COMPLETED.

    await recordActivityEventInTransaction(tx,context,{
      eventType:ACTIVITY_EVENT_TYPES.PROJECTS_RELEASE_UPDATED,
      collegeId:scope.collegeId,organizationId:scope.organizationId,
      subjectType:"project_release",subjectId:shipped.id,subjectLabel:shipped.title,
      summary:"Project release shipped",
      metadata:{projectId:scope.project.id,releaseId:shipped.id,
        releaseKey:shipped.templateKey,sourceTab:"sprints",
        change:"SHIPPED",from:release.status,to:shipped.status,
        previousVersion:release.version,version:shipped.version,
        previousUpdatedAt:release.updatedAt.toISOString(),
        updatedAt:shipped.updatedAt.toISOString()},
      groupKey:"project:"+scope.project.id,
    });
    return shipped;
  });
}

/** Legacy ProjectWorkspaceService transition crosswalk. The admin and
 * mentor writers are distinct audited paths: do not call both per action. */
export const LEGACY_PROJECT_SPRINT_TRANSITIONS = {
 startSprint:{from:"PLANNED",to:"ACTIVE",adminWriter:"startProjectSprint",mentorAction:"START"},
 completeSprint:{from:"ACTIVE",to:"COMPLETED",adminWriter:"completeProjectSprint",mentorAction:"COMPLETE"},
 reopenSprint:{from:"COMPLETED",to:"ACTIVE",adminWriter:"reopenProjectSprint",mentorAction:"REOPEN"},
} as const;

/** Legacy project/sprintKey deep-link lookup. The key is only meaningful
 * inside a project; a duplicated historical alias is ambiguous and must
 * never select the first arbitrary sprint. New links use the UUID. */
export async function resolveLegacySprintHref(ctx:RequestContext,projectIdRaw:string,rawKey:string){
 const scope=await requireProjectReadAccess(ctx,projectIdRaw);
 const key=rawKey.trim();
 if(!key||key.length>120||/[/?#]/.test(key))throw new ProjectsServiceError("PROJECT_SPRINT_NOT_FOUND");
 const rows=await getDb().select({id:projectSprints.id,templateKey:projectSprints.templateKey})
  .from(projectSprints).where(and(eq(projectSprints.projectId,scope.project.id),
   isNull(projectSprints.deletedAt),
   or(eq(projectSprints.legacySprintKey,key),eq(projectSprints.templateKey,key))))
  .limit(2);
 if(rows.length!==1)throw new ProjectsServiceError("PROJECT_SPRINT_NOT_FOUND");
 return {projectId:scope.project.id,sprintId:rows[0]!.id,
  href:"/learn/projects/"+encodeURIComponent(scope.project.id)+"/sprints/"+encodeURIComponent(rows[0]!.id)};
}
