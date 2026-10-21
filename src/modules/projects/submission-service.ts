import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import {assertCurrentEvaluationActor} from "./evaluation-service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {readProjectReadinessOverride} from "./readiness-override-service";
import {effectiveProjectSubmissionReady} from "./readiness-override-model";
import {deriveProjectExecutionReadiness} from "./execution-readiness";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { projectDeliveryActivity } from "./delivery-activity-model";
import {learnerProjectDeliveryReviewNotice} from "./learner-project-review-notification-model";
import {notifyActiveProjectMembers} from "./project-notification-service";
import { projectSubmissionAllowsNewDraft } from "./submission-draft-policy";
import {projectDraftRevisionMatches,nextProjectDraftUpdatedAt} from "./submission-revision-policy";
import {
  collegeMemberships,
  inAppNotifications,
  membershipRoles,
  projectMembers,
  users,
  projectInstances,
  projectSubmissionReviews,
  projectDeliveryEvents,
  projectResourceFiles,
  projectResources,
  projectSubmissions,
  projectReleases,
  projectSprints,
  projectTasks,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import {
  requireProjectLifecycleAccess,
  requireProjectReadAccess,
} from "./access";
import {
  ProjectsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  projectSubmissionDraftInputSchema,
  updateProjectSubmissionDraftInputSchema,
  submitProjectSubmissionInputSchema,
  projectSubmissionIdSchema,
  reviewProjectSubmissionInputSchema,
  type ProjectSubmissionDraftInput,
  type ReviewProjectSubmissionInput,
} from "./validation";

function mapSubmissionConstraint(error: unknown) {
  const constraint =
    postgresConstraintName(error);

  if (
    constraint ===
      "project_submissions_open_project_uq" ||
    constraint ===
      "project_submissions_project_version_uq" ||
    constraint ===
      "project_submission_reviews_submission_uq"
  ) {
    return new ProjectsServiceError(
      "PROJECT_SUBMISSION_CONFLICT",
    );
  }

  return error;
}

async function requireLearnerSubmissionAccess(
  context: RequestContext,
  projectIdInput: string,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );

  if (
    scope.access !== "LEARNER" ||
    !context.membership
  ) {
    throw new ProjectsServiceError(
      "PROJECT_SUBMISSION_ACCESS_DENIED",
    );
  }

  return {
    ...scope,
    membershipId: context.membership.id,
  };
}

export async function createProjectSubmissionDraft(
  context: RequestContext,
  projectIdInput: string,
  rawInput: ProjectSubmissionDraftInput,
) {
  const scope =
    await requireLearnerSubmissionAccess(
      context,
      projectIdInput,
    );
  const input =
    projectSubmissionDraftInputSchema.parse(rawInput);
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [project] = await tx
        .select({ status: projectInstances.status })
        .from(projectInstances)
        .where(eq(projectInstances.id, scope.project.id))
        .for("update")
        .limit(1);

      if (!project || (project.status === "ARCHIVED" || project.status === "COMPLETED")) {
        throw new ProjectsServiceError(
          "PROJECT_SUBMISSION_INVALID_STATE",
        );
      }

      const [open] = await tx
        .select({ id: projectSubmissions.id })
        .from(projectSubmissions)
        .where(
          and(
            eq(projectSubmissions.projectId, scope.project.id),
            inArray(projectSubmissions.status, ["DRAFT", "SUBMITTED"]),
          ),
        )
        .limit(1);

      if (open) {
        throw new ProjectsServiceError(
          "PROJECT_SUBMISSION_CONFLICT",
        );
      }

      const [latest] = await tx
        .select({ id: projectSubmissions.id, version: projectSubmissions.version, status: projectSubmissions.status, reopenedAt:projectSubmissions.reopenedAt })
        .from(projectSubmissions)
        .where(eq(projectSubmissions.projectId, scope.project.id))
        .orderBy(desc(projectSubmissions.version))
        .limit(1);
      // Approved deliveries are immutable. A newer version is possible only
      // after an explicit mentor/admin reopen event on that exact approved row.
      const approvedReopened=latest?.status==="APPROVED" && Boolean(latest.reopenedAt);
      if(!projectSubmissionAllowsNewDraft(latest?.status) && !approvedReopened){
        throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
      }
      // A FILE reference must belong to this project and be READY. Never let
      // a learner attach a foreign or mentor-only resource by guessing its UUID.
      for(const attachment of input.attachments??[]){
        if(attachment.kind!=="FILE")continue;
        const [file]=await tx.select({
          id:projectResourceFiles.id,status:projectResourceFiles.status,
          resourceId:projectResourceFiles.resourceId,
        }).from(projectResourceFiles).where(and(
          eq(projectResourceFiles.id,attachment.fileId!),
          eq(projectResourceFiles.projectId,scope.project.id),
        )).limit(1);
        if(!file||file.status!=="READY")
          throw new ProjectsServiceError("PROJECT_SUBMISSION_ACCESS_DENIED");
        if(file.resourceId){
          const [resource]=await tx.select({status:projectResources.status,visibility:projectResources.visibility})
            .from(projectResources).where(and(eq(projectResources.id,file.resourceId),
              eq(projectResources.projectId,scope.project.id))).limit(1);
          if(!resource||resource.status!=="ACTIVE"||resource.visibility!=="TEAM")
            throw new ProjectsServiceError("PROJECT_SUBMISSION_ACCESS_DENIED");
        }
      }
      const version = (latest?.version ?? 0) + 1;

      const [draft] = await tx
        .insert(projectSubmissions)
        .values({
          projectId: scope.project.id,
          version,
          summary: input.summary,
          sourceUrl: input.sourceUrl ?? null,
          demoUrl: input.demoUrl ?? null,
          notes: input.notes ?? null,
          attachments:input.attachments??[],
          createdByMembershipId: scope.membershipId,
        })
        .returning();

      if (!draft) throw new Error("Project delivery draft insert returned no row");
      if(input.attachments?.length){
        await tx.insert(projectDeliveryEvents).values({
          projectId:scope.project.id,submissionId:draft.id,eventType:"ATTACHMENTS_CHANGED",
          actorMembershipId:scope.membershipId,reason:"Delivery attachment metadata added",
        });
      }
      await recordActivityEventInTransaction(tx, context, projectDeliveryActivity({
        action: "DRAFT_CREATED", collegeId: scope.collegeId,
        organizationId: scope.organizationId, projectId: scope.project.id,
        submissionId: draft.id, version: draft.version,
      }));
      return draft;
    });
  } catch (error) {
    if (error instanceof ProjectsServiceError) throw error;
    throw mapSubmissionConstraint(error);
  }
}

export async function updateProjectSubmissionDraft(
  context: RequestContext,
  projectIdInput: string,
  submissionIdInput: string,
  rawInput: unknown,
) {
  const scope =
    await requireLearnerSubmissionAccess(
      context,
      projectIdInput,
    );
  const input =
    updateProjectSubmissionDraftInputSchema.parse(rawInput);
  const submissionId =
    projectSubmissionIdSchema.parse(submissionIdInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ status: projectInstances.status })
      .from(projectInstances)
      .where(eq(projectInstances.id, scope.project.id))
      .for("update")
      .limit(1);
    if (!project || project.status === "ARCHIVED" || project.status === "COMPLETED") {
      throw new ProjectsServiceError(
        "PROJECT_SUBMISSION_INVALID_STATE",
      );
    }

    const [submission] = await tx
      .select()
      .from(projectSubmissions)
      .where(
        and(
          eq(projectSubmissions.id, submissionId),
          eq(projectSubmissions.projectId, scope.project.id),
        ),
      )
      .for("update")
      .limit(1);

    if (!submission) {
      throw new ProjectsServiceError(
        "PROJECT_SUBMISSION_NOT_FOUND",
      );
    }
    if (submission.status !== "DRAFT") {
      throw new ProjectsServiceError(
        "PROJECT_SUBMISSION_INVALID_STATE",
      );
    }

    // The submission row is held FOR UPDATE, so a second device observes the
    // first writer's revision before applying a stale edit. Millisecond
    // precision matches the browser's ISO token and Drizzle Date values.
    if (!projectDraftRevisionMatches(submission.updatedAt,input.expectedUpdatedAt)) {
      throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
    }

    // A FILE reference must belong to this project and be READY. Never let
      // a learner attach a foreign or mentor-only resource by guessing its UUID.
      for(const attachment of input.attachments??[]){
        if(attachment.kind!=="FILE")continue;
        const [file]=await tx.select({
          id:projectResourceFiles.id,status:projectResourceFiles.status,
          resourceId:projectResourceFiles.resourceId,
        }).from(projectResourceFiles).where(and(
          eq(projectResourceFiles.id,attachment.fileId!),
          eq(projectResourceFiles.projectId,scope.project.id),
        )).limit(1);
        if(!file||file.status!=="READY")
          throw new ProjectsServiceError("PROJECT_SUBMISSION_ACCESS_DENIED");
        if(file.resourceId){
          const [resource]=await tx.select({status:projectResources.status,visibility:projectResources.visibility})
            .from(projectResources).where(and(eq(projectResources.id,file.resourceId),
              eq(projectResources.projectId,scope.project.id))).limit(1);
          if(!resource||resource.status!=="ACTIVE"||resource.visibility!=="TEAM")
            throw new ProjectsServiceError("PROJECT_SUBMISSION_ACCESS_DENIED");
        }
      }

    const [updated] = await tx
      .update(projectSubmissions)
      .set({
        summary: input.summary,
        sourceUrl: input.sourceUrl ?? null,
        demoUrl: input.demoUrl ?? null,
        notes: input.notes ?? null,
        ...(input.attachments!==undefined?{attachments:input.attachments}:{}),
        // Ensure a unique revision even if two saves arrive in one millisecond.
        updatedAt: nextProjectDraftUpdatedAt(submission.updatedAt),
      })
      .where(
        and(
          eq(projectSubmissions.id, submission.id),
          eq(projectSubmissions.projectId, scope.project.id),
          eq(projectSubmissions.status, "DRAFT"),
        ),
      )
      .returning();

    if (!updated) {
      throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
    }
    if(input.attachments!==undefined){
      await tx.insert(projectDeliveryEvents).values({
        projectId:scope.project.id,submissionId:updated.id,
        eventType:"ATTACHMENTS_CHANGED",actorMembershipId:scope.membershipId,
        reason:"Delivery attachment metadata updated",
      });
    }
    await recordActivityEventInTransaction(tx, context, projectDeliveryActivity({
      action: "DRAFT_UPDATED", collegeId: scope.collegeId,
      organizationId: scope.organizationId, projectId: scope.project.id,
      submissionId: updated.id, version: updated.version,
    }));
    return updated;
  });
}

export async function submitProjectSubmission(
  context: RequestContext,
  projectIdInput: string,
  submissionIdInput: string,
  rawInput:unknown,
) {
  const scope =
    await requireLearnerSubmissionAccess(
      context,
      projectIdInput,
    );
  const submissionId =
    projectSubmissionIdSchema.parse(submissionIdInput);
  const input=submitProjectSubmissionInputSchema.parse(rawInput);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [project] = await tx
      .select({ status: projectInstances.status })
      .from(projectInstances)
      .where(eq(projectInstances.id, scope.project.id))
      .for("update")
      .limit(1);

    if (!project || project.status === "ARCHIVED" || project.status === "COMPLETED") {
      throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
    }
    const [releases,sprints,tasks]=await Promise.all([
      tx.select({status:projectReleases.status}).from(projectReleases)
        .where(eq(projectReleases.projectId,scope.project.id)),
      tx.select({status:projectSprints.status}).from(projectSprints)
        .where(and(eq(projectSprints.projectId,scope.project.id),
          isNull(projectSprints.deletedAt))),
      tx.select({status:projectTasks.status}).from(projectTasks)
        .where(and(eq(projectTasks.projectId,scope.project.id),
          isNull(projectTasks.deletedAt))),
    ]);
    const execution=deriveProjectExecutionReadiness({
      projectStatus:project.status,
      releaseStatuses:releases.map(row=>row.status),
      sprintStatuses:sprints.map(row=>row.status),
      taskStatuses:tasks.map(row=>row.status),
    });
    const override=await readProjectReadinessOverride(tx,scope.project.id,scope.collegeId);
    if (!effectiveProjectSubmissionReady(execution.complete,override.state)) {
      throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
    }

    const [submission] = await tx
      .select()
      .from(projectSubmissions)
      .where(
        and(
          eq(projectSubmissions.id, submissionId),
          eq(projectSubmissions.projectId, scope.project.id),
        ),
      )
      .for("update")
      .limit(1);

    if (!submission) {
      throw new ProjectsServiceError(
        "PROJECT_SUBMISSION_NOT_FOUND",
      );
    }
    if (submission.status !== "DRAFT") {
      throw new ProjectsServiceError(
        "PROJECT_SUBMISSION_INVALID_STATE",
      );
    }

    if(!projectDraftRevisionMatches(submission.updatedAt,input.expectedUpdatedAt)){
      throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
    }
    const files=Array.isArray(submission.attachments)
      ? submission.attachments.filter((entry):entry is {kind:"FILE";fileId:string} =>
          Boolean(entry)&&typeof entry==="object"&&(entry as {kind?:string}).kind==="FILE"&&
          typeof (entry as {fileId?:unknown}).fileId==="string")
      : [];
    if(!submission.sourceUrl&&!submission.demoUrl&&!files.length){
      throw new ProjectsServiceError("PROJECT_SUBMISSION_CONTENT_REQUIRED");
    }
    for(const entry of files){
      const [file]=await tx.select({id:projectResourceFiles.id,status:projectResourceFiles.status,
        resourceId:projectResourceFiles.resourceId}).from(projectResourceFiles).where(and(
        eq(projectResourceFiles.id,entry.fileId),eq(projectResourceFiles.projectId,scope.project.id)
      )).limit(1);
      if(file?.status!=="READY")throw new ProjectsServiceError("PROJECT_SUBMISSION_ACCESS_DENIED");
      if(file.resourceId){
        const [resource]=await tx.select({visibility:projectResources.visibility,status:projectResources.status})
          .from(projectResources).where(and(eq(projectResources.id,file.resourceId),
            eq(projectResources.projectId,scope.project.id))).limit(1);
        if(resource?.visibility!=="TEAM"||resource.status!=="ACTIVE")
          throw new ProjectsServiceError("PROJECT_SUBMISSION_ACCESS_DENIED");
      }
    }

    const now = new Date();
    const [submitted] = await tx
      .update(projectSubmissions)
      .set({
        status: "SUBMITTED",
        submittedByMembershipId: scope.membershipId,
        submittedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(projectSubmissions.id, submission.id),
          eq(projectSubmissions.projectId, scope.project.id),
          eq(projectSubmissions.status, "DRAFT"),
        ),
      )
      .returning();

    if (!submitted) {
      throw new ProjectsServiceError(
        "PROJECT_SUBMISSION_INVALID_STATE",
      );
    }

    const event = await recordActivityEventInTransaction(tx, context, projectDeliveryActivity({
      action: "SUBMITTED", collegeId: scope.collegeId,
      organizationId: scope.organizationId, projectId: scope.project.id,
      submissionId: submitted.id, version: submitted.version,
    }));
    await notifyActiveProjectMembers(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,
      roles:["MENTOR"],exceptUserId:context.user.id,
      title:"Delivery submitted",body:"A final delivery is ready for review.",
      actionHref:"/mentor/projects/"+scope.project.id+"?tab=delivery",
    });
    return submitted;
  });
}

export async function reviewProjectSubmission(
  context: RequestContext,
  projectIdInput: string,
  submissionIdInput: string,
  rawInput: ReviewProjectSubmissionInput,
) {
  const scope =
    await requireProjectLifecycleAccess(
      context,
      projectIdInput,
    );
  const input =
    reviewProjectSubmissionInputSchema.parse(
      rawInput,
    );
  const submissionId =
    projectSubmissionIdSchema.parse(submissionIdInput);
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [project] = await tx
        .select({ status: projectInstances.status })
        .from(projectInstances)
        .where(eq(projectInstances.id, scope.project.id))
        .for("update")
        .limit(1);
      if (!project || project.status === "ARCHIVED" || project.status === "COMPLETED") {
        throw new ProjectsServiceError(
          "PROJECT_SUBMISSION_INVALID_STATE",
        );
      }

      const [submission] = await tx
        .select()
        .from(projectSubmissions)
        .where(
          and(
            eq(projectSubmissions.id, submissionId),
            eq(projectSubmissions.projectId, scope.project.id),
          ),
        )
        .for("update")
        .limit(1);

      if (!submission) {
        throw new ProjectsServiceError(
          "PROJECT_SUBMISSION_NOT_FOUND",
        );
      }
      if (submission.status !== "SUBMITTED" || submission.lockedAt) {
        throw new ProjectsServiceError("PROJECT_SUBMISSION_INVALID_STATE");
      }
      // A historical submitted delivery must never be approved when a newer
      // version exists. The parent project lock also serializes draft creation.
      const [latest]=await tx.select({id:projectSubmissions.id})
       .from(projectSubmissions).where(eq(projectSubmissions.projectId,scope.project.id))
       .orderBy(desc(projectSubmissions.version)).limit(1);
      if(latest?.id!==submission.id||
         input.expectedVersion!==undefined&&input.expectedVersion!==submission.version||
         input.expectedUpdatedAt!==undefined&&
           !projectDraftRevisionMatches(submission.updatedAt,input.expectedUpdatedAt)){
        throw new ProjectsServiceError("PROJECT_SUBMISSION_CONFLICT");
      }

      // Re-read the reviewer grant while holding SHARE locks in this same
      // transaction. A mentor removed mid-review or an administrator disabled
      // after the initial request context must not finalize a private result.
      const reviewerAccess=scope.access;
      if(reviewerAccess!=="ADMIN"&&reviewerAccess!=="MENTOR")
        throw new ProjectsServiceError("PROJECT_LIFECYCLE_ACCESS_DENIED");
      await assertCurrentEvaluationActor(tx,context,{
        project:{id:scope.project.id},
        collegeId:scope.collegeId,organizationId:scope.organizationId,
        access:reviewerAccess,
      });

      const [review] = await tx
        .insert(projectSubmissionReviews)
        .values({
          projectId: scope.project.id,
          submissionId: submission.id,
          decision: input.decision,
          feedback: input.feedback ?? null,
          reviewedByUserId: context.user.id,
          reviewedByMembershipId:
            context.membership?.id ?? null,
        })
        .returning();

      const [updated] = await tx
        .update(projectSubmissions)
        .set({
          status: input.decision,
          ...(input.decision==="APPROVED"?{lockedAt:new Date(),reopenedAt:null}:{}),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projectSubmissions.id, submission.id),
            eq(projectSubmissions.projectId, scope.project.id),
            eq(projectSubmissions.status, "SUBMITTED"),
          ),
        )
        .returning();

      if (!updated) {
        throw new ProjectsServiceError(
          "PROJECT_SUBMISSION_INVALID_STATE",
        );
      }

      if (!review) throw new Error("Project delivery review insert returned no row");
      const reviewEvent = await recordActivityEventInTransaction(tx, context, projectDeliveryActivity({
        action: "REVIEWED", collegeId: scope.collegeId,
        organizationId: scope.organizationId, projectId: scope.project.id,
        submissionId: updated.id, version: updated.version,
        decision: input.decision,
      }));
      // Every active learner on this project gets a personal final-delivery decision.
      // The notification is committed with the review; no private feedback is copied.
      const projectLearners=await tx.select({userId:collegeMemberships.userId})
        .from(projectMembers)
        .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
        .innerJoin(users,eq(users.id,collegeMemberships.userId))
        .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
          eq(membershipRoles.role,"LEARNER")))
        .where(and(eq(projectMembers.projectId,scope.project.id),
          eq(projectMembers.role,"LEARNER"),eq(projectMembers.roleKind,"LEARNER"),
          eq(collegeMemberships.collegeId,scope.collegeId),
          eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
          // A past project member must not get a private decision.
          isNull(projectMembers.endedAt)));
      const recipients=[...new Set(projectLearners.map(member=>member.userId))]
        .filter(userId=>userId!==context.user.id);
      if(recipients.length){
        const notice=learnerProjectDeliveryReviewNotice(scope.project.id,input.decision);
        await tx.insert(inAppNotifications).values(recipients.map(userId=>({
          userId,eventId:reviewEvent.id,title:notice.title,body:notice.body,
          actionHref:notice.actionHref,
        }))).onConflictDoNothing();
      }
      if(input.decision==="APPROVED"){
        // Registered 0091 event row is immutable; supersede no prior review.
        if(context.membership?.id){
          await tx.insert(projectDeliveryEvents).values({
            projectId:scope.project.id,submissionId:updated.id,eventType:"LOCKED",
            actorMembershipId:context.membership.id,reason:"Submission approved",
          });
        }
        await recordActivityEventInTransaction(tx,context,projectDeliveryActivity({
          action:"LOCKED",collegeId:scope.collegeId,organizationId:scope.organizationId,
          projectId:scope.project.id,submissionId:updated.id,version:updated.version,
        }));
      }
      return { submission: updated, review };
    });
  } catch (error) {
    if (error instanceof ProjectsServiceError) {
      throw error;
    }
    throw mapSubmissionConstraint(error);
  }
}

export async function listProjectSubmissions(
  context: RequestContext,
  projectIdInput: string,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );
  const db = getDb();
  const [submissions, reviews, deliveryEvents] =
    await Promise.all([
      db
        .select()
        .from(projectSubmissions)
        .where(
          eq(
            projectSubmissions.projectId,
            scope.project.id,
          ),
        )
        .orderBy(asc(projectSubmissions.version)),
      db
        .select()
        .from(projectSubmissionReviews)
        .where(
          eq(
            projectSubmissionReviews.projectId,
            scope.project.id,
          ),
        )
        .orderBy(
          asc(
            projectSubmissionReviews.reviewedAt,
          ),
        ),
      db.select().from(projectDeliveryEvents).where(
       eq(projectDeliveryEvents.projectId,scope.project.id))
       .orderBy(asc(projectDeliveryEvents.occurredAt)),
    ]);
  // Legacy flattened one delivery's history into a mutable DTO. vNext keeps
  // immutable typed submission, feedback and technical events; this read-only
  // crosswalk restores the chronological workflow without mutating snapshots.
  type HistoryEntry={
    id:string;submissionId:string;version:number;kind:string;
    occurredAt:string;status:string|null;feedback:string|null;
  };
  const byId=new Map(submissions.map(submission=>[submission.id,submission]));
  const history:HistoryEntry[]=[];
  for(const submission of submissions){
   history.push({id:"created:"+submission.id,submissionId:submission.id,
     version:submission.version,kind:"DRAFT_CREATED",
     occurredAt:submission.createdAt.toISOString(),status:"DRAFT",feedback:null});
   if(submission.submittedAt)history.push({id:"submitted:"+submission.id,
     submissionId:submission.id,version:submission.version,kind:"SUBMITTED",
     occurredAt:submission.submittedAt.toISOString(),status:"SUBMITTED",feedback:null});
  }
  for(const review of reviews){
   const submission=byId.get(review.submissionId);
   if(!submission)continue;
   history.push({id:"review:"+review.id,submissionId:review.submissionId,
    version:submission.version,kind:"REVIEWED",occurredAt:review.reviewedAt.toISOString(),
    status:review.decision,feedback:review.feedback});
  }
  for(const event of deliveryEvents){
   const submission=byId.get(event.submissionId);
   if(!submission)continue;
   history.push({id:"event:"+event.id,submissionId:event.submissionId,
    version:submission.version,kind:event.eventType,
    occurredAt:event.occurredAt.toISOString(),status:event.legacyStatus??null,
    feedback:event.legacyFeedback??null});
  }
  history.sort((a,b)=>a.occurredAt.localeCompare(b.occurredAt)||
    a.version-b.version||a.id.localeCompare(b.id));
  return {submissions,reviews,deliveryEvents,history};
}
