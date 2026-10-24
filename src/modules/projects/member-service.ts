import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { getDb } from "@/db/client";
import { containsLikePattern } from "@/lib/sql-match";
import {randomUUID} from "node:crypto";
import {projectTeamAuditInput} from "./mentor-team-audit-model";
import {assertPersistedProjectMutationActor} from "./persisted-mentor-mutation";
import { mayRemovePrimaryProjectMentor } from "./primary-mentor-policy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { notifyActiveProjectMembers, notifyProjectMemberships } from "./project-notification-service";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import {
  collegeMemberships,
  membershipRoles,
  projectInstances,
  projectMeetings,
  projectMembers,
  projectTasks,
  users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { requirePermission } from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission,type PermissionTransaction} from "@/modules/permissions/persisted-actor";
import type { ProjectMemberRole } from "./constants";
import {
  ProjectsServiceError,
  postgresConstraintName,
} from "./errors";
import {
  requireProjectManageAccess,
  requireProjectReadAccess,
} from "./access";
import { loadProjectCollegeScope } from "./scope";
import {getProjectAdminCollegeId} from "./admin-college-scope";
import {
  addProjectMemberInputSchema,
  bulkProjectMentorReassignmentInputSchema,
  projectMemberCandidateQuerySchema,
  projectMentorCandidateQuerySchema,
  projectMemberIdSchema,
  updateProjectMemberInputSchema,
  type AddProjectMemberInput,
  type BulkProjectMentorReassignmentInput,
  type UpdateProjectMemberInput,
} from "./validation";

function mapMemberConstraint(error: unknown) {
  switch (postgresConstraintName(error)) {
    case "project_members_active_membership_uq":
      return new ProjectsServiceError(
        "PROJECT_MEMBER_CONFLICT",
      );
    case "project_members_active_primary_mentor_uq":
      return new ProjectsServiceError(
        "PROJECT_PRIMARY_MENTOR_CONFLICT",
      );
    default:
      return error;
  }
}

async function loadEligibleMembership(
  tx: PermissionTransaction,
  membershipId: string,
  collegeId: string,
  role: ProjectMemberRole,
) {
  const [membership] = await tx
    .select({
      id: collegeMemberships.id,
      collegeId: collegeMemberships.collegeId,
      status: collegeMemberships.status,
      platformStatus: users.platformStatus,
      displayName: users.displayName,
    })
    .from(collegeMemberships)
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .innerJoin(
      membershipRoles,
      and(
        eq(
          membershipRoles.membershipId,
          collegeMemberships.id,
        ),
        eq(membershipRoles.role, role),
      ),
    )
    .where(
      and(
        eq(collegeMemberships.id, membershipId),
        eq(collegeMemberships.status, "ACTIVE"),
      ),
    )
    .for("share")
    .limit(1);

  if (!membership || membership.platformStatus !== "ACTIVE") {
    throw new ProjectsServiceError(
      "PROJECT_MEMBER_ROLE_REQUIRED",
    );
  }

  if (membership.collegeId !== collegeId) {
    throw new ProjectsServiceError(
      "PROJECT_MEMBER_COLLEGE_MISMATCH",
    );
  }

  return membership;
}

async function loadActiveProjectMember(
  projectId: string,
  memberId: string,
) {
  const [member] = await getDb()
    .select()
    .from(projectMembers)
    .where(
      and(
        eq(projectMembers.id, memberId),
        eq(projectMembers.projectId, projectId),
        isNull(projectMembers.endedAt),
      ),
    )
    .limit(1);

  if (!member) {
    throw new ProjectsServiceError(
      "PROJECT_MEMBER_NOT_FOUND",
    );
  }

  return member;
}

export async function listProjectMemberCandidates(
  context: RequestContext,
  projectIdInput: string,
  rawQuery: unknown,
) {
  const query=projectMemberCandidateQuerySchema.parse(rawQuery);
  const scope=await requireProjectReadAccess(context,projectIdInput);
  const mentorAction=scope.access==="MENTOR";
  if(!mentorAction&&scope.access!=="ADMIN")
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  if(mentorAction&&query.role!=="LEARNER")
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const search = query.q
    ? or(
        ilike(users.displayName, containsLikePattern(query.q)),
        ilike(users.email, containsLikePattern(query.q)),
      )
    : undefined;

  return getDb().transaction(async tx=>{
    if(mentorAction)await assertPersistedProjectMutationActor(tx,context,scope);
    else await assertPersistedPlatformPermission(tx,context,"projects.manage",{
      organizationId:scope.organizationId,collegeId:scope.collegeId,
    });
    // Serialize candidate reads with an archive; no invitation list may be
    // acted on after its owning workspace becomes immutable.
    const [liveProject]=await tx.select({
      status:projectInstances.status,deletedAt:projectInstances.deletedAt,
      teamGroupId:projectInstances.teamGroupId,
    })
      .from(projectInstances)
      .where(and(eq(projectInstances.id,scope.project.id),
        eq(projectInstances.collegeId,scope.collegeId)))
      .for("share").limit(1);
    if(!liveProject||liveProject.deletedAt||["ARCHIVED","COMPLETED"].includes(liveProject.status))
      throw new ProjectsServiceError("PROJECT_INVALID_STATE");
    if(mentorAction&&liveProject.teamGroupId)
      throw new ProjectsServiceError("PROJECT_TEAM_GROUP_MANAGED");
    return tx.select({
      membershipId: collegeMemberships.id,
      displayName: users.displayName,
      email: users.email,
    })
    .from(collegeMemberships)
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(
      membershipRoles,
      and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, query.role),
      ),
    )
    .leftJoin(
      projectMembers,
      and(
        eq(projectMembers.membershipId, collegeMemberships.id),
        eq(projectMembers.projectId, scope.project.id),
        isNull(projectMembers.endedAt),
      ),
    )
    .where(
      and(
        eq(collegeMemberships.collegeId, scope.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(users.platformStatus, "ACTIVE"),
        isNull(projectMembers.id),
        search,
      ),
    )
    .orderBy(asc(users.displayName), asc(collegeMemberships.id))
    .limit(query.limit);
  });
}

export async function listProjectMentorCandidates(
  context: RequestContext,
  collegeIdInput: string,
  rawQuery: unknown,
) {
  const query=projectMentorCandidateQuerySchema.parse(rawQuery);
  // A forged college must not reveal a staff roster or even whether its ID
  // exists. A request snapshot is not sufficient for a long-running read.
  if(getProjectAdminCollegeId(context)!==collegeIdInput)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const college=await loadProjectCollegeScope(collegeIdInput);
  requirePermission(context,"projects.manage",{
    organizationId:college.organizationId,collegeId:college.id,
  });
  const search = query.q
    ? or(
        ilike(users.displayName, containsLikePattern(query.q)),
        ilike(users.email, containsLikePattern(query.q)),
      )
    : undefined;

  return getDb().transaction(async tx=>{
    await assertPersistedPlatformPermission(tx,context,"projects.manage",{
      organizationId:college.organizationId,collegeId:college.id,
    });
    return tx.select({
      membershipId: collegeMemberships.id,
      displayName: users.displayName,
      email: users.email,
    })
    .from(collegeMemberships)
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .innerJoin(
      membershipRoles,
      and(
        eq(
          membershipRoles.membershipId,
          collegeMemberships.id,
        ),
        eq(membershipRoles.role, "MENTOR"),
      ),
    )
    .where(
      and(
        eq(
          collegeMemberships.collegeId,
          college.id,
        ),
        eq(collegeMemberships.status, "ACTIVE"),
        eq(users.platformStatus, "ACTIVE"),
        search,
      ),
    )
    .orderBy(
      asc(users.displayName),
      asc(collegeMemberships.id),
    )
    .limit(query.limit).offset(query.offset);
  });
}

export async function reassignProjectPrimaryMentor(
  context: RequestContext,
  projectIdInput: string,
  mentorMembershipId: string,
  roleLabel = "Project Mentor",
) {
  const scope =
    await requireProjectManageAccess(
      context,
      projectIdInput,
    );
  const db = getDb();

  try {
    return await db.transaction(async (tx) => {
      const [project] = await tx
        .select({
          id: projectInstances.id,
          collegeId: projectInstances.collegeId,
          status: projectInstances.status,
        })
        .from(projectInstances)
        .where(
          and(
            eq(
              projectInstances.id,
              scope.project.id,
            ),
            eq(
              projectInstances.collegeId,
              scope.collegeId,
            ),
          ),
        )
        .for("update")
        .limit(1);

      if (
        !project ||
        project.status === "ARCHIVED"
      ) {
        throw new ProjectsServiceError(
          "PROJECT_INVALID_STATE",
        );
      }
      await assertPersistedPlatformPermission(tx,context,"projects.manage",{
        collegeId:scope.collegeId,organizationId:scope.organizationId,
      });

      const [eligibleTarget] = await tx
        .select({
          membershipId: collegeMemberships.id,
          displayName: users.displayName,
        })
        .from(collegeMemberships)
        .innerJoin(
          users,
          eq(
            users.id,
            collegeMemberships.userId,
          ),
        )
        .innerJoin(
          membershipRoles,
          and(
            eq(
              membershipRoles.membershipId,
              collegeMemberships.id,
            ),
            eq(
              membershipRoles.role,
              "MENTOR",
            ),
          ),
        )
        .where(
          and(
            eq(
              collegeMemberships.id,
              mentorMembershipId,
            ),
            eq(
              collegeMemberships.collegeId,
              scope.collegeId,
            ),
            eq(
              collegeMemberships.status,
              "ACTIVE",
            ),
            eq(users.platformStatus, "ACTIVE"),
          ),
        )
        .for("share")
        .limit(1);

      if (!eligibleTarget) {
        throw new ProjectsServiceError(
          "PROJECT_MEMBER_ROLE_REQUIRED",
        );
      }

      const activeMembers = await tx
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(
              projectMembers.projectId,
              project.id,
            ),
            isNull(projectMembers.endedAt),
          ),
        )
        .for("update");

      const currentPrimary =
        activeMembers.find(
          (member) =>
            member.role === "MENTOR" &&
            member.isPrimary,
        ) ?? null;
      const targetMember =
        activeMembers.find(
          (member) =>
            member.membershipId ===
            mentorMembershipId,
        ) ?? null;

      if (
        targetMember &&
        targetMember.role !== "MENTOR"
      ) {
        throw new ProjectsServiceError(
          "PROJECT_MEMBER_ROLE_REQUIRED",
        );
      }

      const normalizedRoleLabel =
        roleLabel.trim() || "Project Mentor";
      if (
        currentPrimary?.membershipId ===
          mentorMembershipId &&
        (currentPrimary.roleLabel?.trim() ||
          "Project Mentor").toLocaleLowerCase() ===
          normalizedRoleLabel.toLocaleLowerCase()
      ) {
        return {
          projectId: project.id,
          reassigned: false,
          skipped: true,
          outgoingMembershipId:
            currentPrimary.membershipId,
          mentorMembershipId,
          mentorName:
            eligibleTarget.displayName,
        };
      }

      const now = new Date();
      if (
        currentPrimary &&
        currentPrimary.id !== targetMember?.id
      ) {
        await tx
          .update(projectMembers)
          .set({
            isPrimary: false,
            endedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(
                projectMembers.id,
                currentPrimary.id,
              ),
              isNull(projectMembers.endedAt),
            ),
          );
      }

      if (targetMember) {
        await tx
          .update(projectMembers)
          .set({
            isPrimary: true,
            roleLabel: normalizedRoleLabel,
            updatedAt: now,
          })
          .where(
            and(
              eq(
                projectMembers.id,
                targetMember.id,
              ),
              isNull(projectMembers.endedAt),
            ),
          );
      } else {
        await tx
          .insert(projectMembers)
          .values({
            projectId: project.id,
            membershipId:
              mentorMembershipId,
            role: "MENTOR",
            roleKind: "MENTOR",
            canMutate: true,
            isPrimary: true,
            roleLabel: normalizedRoleLabel,
            createdByUserId: context.user.id,
          });
      }

      if (currentPrimary && currentPrimary.membershipId !== mentorMembershipId) {
        // COL-people-23: ownership of the outgoing mentor's tasks must not
        // remain on a membership which is no longer in this workspace.
        await tx.update(projectTasks)
          .set({ assigneeMembershipId: null, updatedAt: now })
          .where(and(
            eq(projectTasks.projectId, project.id),
            eq(projectTasks.assigneeMembershipId, currentPrimary.membershipId),
          ));
      }

      if (
        currentPrimary &&
        currentPrimary.membershipId !==
          mentorMembershipId
      ) {
        await tx
          .update(projectMeetings)
          .set({
            status: "CANCELLED",
            cancellationNote:
              "Primary mentor reassigned",
            updatedAt: now,
          })
          .where(
            and(
              eq(
                projectMeetings.projectId,
                project.id,
              ),
              eq(
                projectMeetings
                  .scheduledByMembershipId,
                currentPrimary.membershipId,
              ),
              inArray(
                projectMeetings.status,
                ["REQUESTED", "SCHEDULED"],
              ),
            ),
          );
      }

      await tx
        .update(projectInstances)
        .set({ updatedAt: now })
        .where(
          eq(
            projectInstances.id,
            project.id,
          ),
        );

      const reassignedEvent = await recordActivityEventInTransaction(
        tx,
        context,
        {
          eventType:
            ACTIVITY_EVENT_TYPES.PROJECTS_MENTOR_REASSIGNED,
          collegeId: project.collegeId,
          organizationId:
            scope.organizationId,
          subjectType:
            "project_instance",
          subjectId: project.id,
          subjectLabel:
            scope.project.title,
          summary:
            "Primary Project mentor reassigned",
          metadata: {
            projectId: project.id,
            outgoingMembershipId:
              currentPrimary?.membershipId ?? null,
            incomingMembershipId:
              mentorMembershipId,
          },
          groupKey:
            "projects:instance:" +
            project.id,
          dedupeKey:
            "projects:instance:" +
            project.id +
            ":mentor-reassigned:" +
            now.toISOString(),
        },
      );

      await notifyProjectMemberships(tx, reassignedEvent.id, {
        projectId: project.id, collegeId: scope.collegeId,
        membershipIds: [mentorMembershipId, ...(currentPrimary?.membershipId &&
          currentPrimary.membershipId !== mentorMembershipId ? [currentPrimary.membershipId] : [])],
        title: "Project mentor reassigned",
        body: "The mentor for " + scope.project.title + " has changed.",
        actionHref: "/mentor/projects/" + project.id,
      });
      await notifyActiveProjectMembers(tx, reassignedEvent.id, {
        projectId: project.id, collegeId: scope.collegeId, roles: ["LEARNER"],
        title: "Project mentor reassigned",
        body: "Your project " + scope.project.title + " has a new mentor.",
        actionHref: "/learn/projects/" + project.id,
      });
      return {
        projectId: project.id,
        reassigned: true,
        skipped: false,
        outgoingMembershipId:
          currentPrimary?.membershipId ?? null,
        mentorMembershipId,
        mentorName:
          eligibleTarget.displayName,
      };
    });
  } catch (error) {
    if (error instanceof ProjectsServiceError) {
      throw error;
    }
    throw mapMemberConstraint(error);
  }
}

export async function bulkReassignProjectMentor(
  context: RequestContext,
  rawInput: BulkProjectMentorReassignmentInput,
) {
  const input =
    bulkProjectMentorReassignmentInputSchema.parse(
      rawInput,
    );
  // The caller's chosen tenant must match the selected college before any
  // college/project existence lookup. Individual projects remain checked
  // again inside their own locked and persistently authorized transactions.
  if(getProjectAdminCollegeId(context)!==input.collegeId)
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const college =
    await loadProjectCollegeScope(
      input.collegeId,
    );
  requirePermission(context, "projects.manage", {
    organizationId: college.organizationId,
    collegeId: college.id,
  });

  let reassignedCount = 0;
  let skippedCount = 0;
  const failures: {
    projectId: string;
    code: string;
  }[] = [];

  for (const projectId of input.projectIds) {
    try {
      const [project] = await getDb()
        .select({
          collegeId: projectInstances.collegeId,
        })
        .from(projectInstances)
        .where(
          eq(projectInstances.id, projectId),
        )
        .limit(1);
      if (
        !project ||
        project.collegeId !== input.collegeId
      ) {
        throw new ProjectsServiceError(
          "PROJECT_ACCESS_DENIED",
        );
      }

      const result =
        await reassignProjectPrimaryMentor(
          context,
          projectId,
          input.mentorMembershipId,
          input.roleLabel,
        );

      if (result.skipped) {
        skippedCount += 1;
      } else {
        reassignedCount += 1;
      }
    } catch (error) {
      failures.push({
        projectId,
        code:
          error instanceof ProjectsServiceError
            ? error.code
            : "PROJECT_REASSIGNMENT_FAILED",
      });
    }
  }

  return {
    reassignedCount,
    skippedCount,
    failures,
    taskAssignmentClearingSupported: true,
  };
}

export async function addProjectMember(
  context: RequestContext,
  projectIdInput: string,
  rawInput: AddProjectMemberInput,
) {
  const scope=await requireProjectReadAccess(context,projectIdInput);
  const mentorAction=scope.access==="MENTOR";
  if(!mentorAction&&scope.access!=="ADMIN")
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const input =
    addProjectMemberInputSchema.parse(rawInput);
  if(mentorAction&&(input.role!=="LEARNER"||input.isPrimary||
     (input.roleKind!==undefined&&input.roleKind!=="LEARNER")||
     input.canMutate===false))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");


  try {
    const [member] = await getDb().transaction(async tx => {
      const [project] = await tx.select({ teamGroupId: projectInstances.teamGroupId,status:projectInstances.status,deletedAt:projectInstances.deletedAt })
        .from(projectInstances).where(eq(projectInstances.id, scope.project.id)).for("update");
      if(!project||project.deletedAt||["ARCHIVED","COMPLETED"].includes(project.status))throw new ProjectsServiceError("PROJECT_INVALID_STATE");
      if(mentorAction)await assertPersistedProjectMutationActor(tx,context,scope);
      else await assertPersistedPlatformPermission(tx,context,"projects.manage",{
        collegeId:scope.collegeId,organizationId:scope.organizationId,
      });
      if (input.role === "LEARNER" && project.teamGroupId)
        throw new ProjectsServiceError("PROJECT_TEAM_GROUP_MANAGED");
      // Lock the actual target membership, its platform user and role
      // together with this project write. A pre-transaction eligibility
      // snapshot could be revoked immediately before assignment.
      await loadEligibleMembership(tx,input.membershipId,scope.collegeId,input.role);
      const [already]=await tx.select().from(projectMembers).where(and(
        eq(projectMembers.projectId,scope.project.id),
        eq(projectMembers.membershipId,input.membershipId),
        isNull(projectMembers.endedAt),
      )).for("update").limit(1);
      if(already){
        const kind=input.roleKind??(input.role==="MENTOR"?"MENTOR":"LEARNER");
        const canMutate=input.canMutate??!["OBSERVER","REVIEWER","QA"].includes(kind);
        if(already.role===input.role&&already.roleKind===kind&&
           already.canMutate===canMutate&&already.isPrimary===input.isPrimary&&
           (already.roleLabel??null)===(input.roleLabel??null))return [already];
        throw new ProjectsServiceError("PROJECT_MEMBER_CONFLICT");
      }
      const [created]=await tx.insert(projectMembers).values({
        projectId: scope.project.id,
        membershipId: input.membershipId,
        role: input.role,
        roleKind: input.roleKind ?? (input.role === "MENTOR" ? "MENTOR" : "LEARNER"),
        canMutate: input.canMutate ?? !["OBSERVER","REVIEWER","QA"].includes(input.roleKind ?? ""),
        isPrimary: input.isPrimary,
        roleLabel: input.roleLabel ?? null,
        createdByUserId: context.user.id,
      }).returning();
      if(!created)throw new ProjectsServiceError("PROJECT_MEMBER_NOT_FOUND");
      const event = await recordActivityEventInTransaction(tx,context,projectTeamAuditInput("ADDED",{
        projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
      },created));
      await notifyProjectMemberships(tx,event.id,{
        projectId:scope.project.id,collegeId:scope.collegeId,
        membershipIds:[created.membershipId],
        title:created.role==="MENTOR"?"New project assigned":"Added to project",
        body:"You have been added to "+scope.project.title+".",
        actionHref:(created.role==="MENTOR"?"/mentor/projects/":"/learn/projects/")+scope.project.id,
      });
      return [created];
    });
    return member;
  } catch (error) {
    throw mapMemberConstraint(error);
  }
}

export async function updateProjectMember(
  context: RequestContext,
  projectIdInput: string,
  memberIdInput: string,
  rawInput: UpdateProjectMemberInput,
) {
  const scope=await requireProjectReadAccess(context,projectIdInput);
  const mentorAction=scope.access==="MENTOR";
  if(!mentorAction && scope.access!=="ADMIN")
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const memberId =
    projectMemberIdSchema.parse(memberIdInput);
  const input =
    updateProjectMemberInputSchema.parse(rawInput);
  const member = await loadActiveProjectMember(
    scope.project.id,
    memberId,
  );

  // Assigned Mentors can maintain learner responsibility labels only.
  // They cannot appoint other Mentors, grant access or alter system roles.
  if(mentorAction&&(member.role!=="LEARNER"||input.roleLabel===undefined||
     input.isPrimary!==undefined||input.roleKind!==undefined||input.canMutate!==undefined))
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  if (
    input.isPrimary === true &&
    member.role !== "MENTOR"
  ) {
    throw new ProjectsServiceError(
      "PROJECT_MEMBER_ROLE_REQUIRED",
    );
  }

  try {
    const [updated]=await getDb().transaction(async tx=>{
      const [project]=await tx.select({status:projectInstances.status,deletedAt:projectInstances.deletedAt,teamGroupId:projectInstances.teamGroupId})
        .from(projectInstances).where(eq(projectInstances.id,scope.project.id))
        .for("update").limit(1);
      if(!project||project.deletedAt||["ARCHIVED","COMPLETED"].includes(project.status))throw new ProjectsServiceError("PROJECT_INVALID_STATE");
      if(mentorAction){
        await assertPersistedProjectMutationActor(tx,context,scope);
        if(project.teamGroupId)throw new ProjectsServiceError("PROJECT_TEAM_GROUP_MANAGED");
      }else{
        await assertPersistedPlatformPermission(tx,context,"projects.manage",{
          collegeId:scope.collegeId,organizationId:scope.organizationId,
        });
      }
      const [fresh]=await tx.select().from(projectMembers)
        .where(and(
          eq(projectMembers.id,member.id),eq(projectMembers.projectId,scope.project.id),
          isNull(projectMembers.endedAt),
        )).for("update").limit(1);
      if(!fresh)throw new ProjectsServiceError("PROJECT_MEMBER_NOT_FOUND");
      if(mentorAction&&fresh.role!=="LEARNER")
        throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
      // A saved project lead is a responsibility label, not a privilege grant.
      // Serialize promotions under the project lock to keep one current lead.
      const nextLabel=input.roleLabel?.trim().toLocaleLowerCase("en");
      if(mentorAction&&nextLabel&&["lead","student lead","team lead","team leader"].includes(nextLabel)){
        const [anotherLead]=await tx.select({id:projectMembers.id})
          .from(projectMembers).where(and(
            eq(projectMembers.projectId,scope.project.id),
            eq(projectMembers.role,"LEARNER"),
            isNull(projectMembers.endedAt),
            ne(projectMembers.id,fresh.id),
            sql`lower(btrim(${projectMembers.roleLabel})) in ('lead','student lead','team lead','team leader')`,
          )).limit(1);
        if(anotherLead)throw new ProjectsServiceError("PROJECT_MEMBER_CONFLICT");
      }
      const unchanged=(input.isPrimary===undefined||input.isPrimary===fresh.isPrimary)&&
        (input.roleKind===undefined||input.roleKind===fresh.roleKind)&&
        (input.canMutate===undefined||input.canMutate===fresh.canMutate)&&
        (input.roleLabel===undefined||input.roleLabel===fresh.roleLabel);
      if(unchanged)return [fresh];
      if(input.expectedUpdatedAt!==undefined&&
         Date.parse(input.expectedUpdatedAt)!==fresh.updatedAt.getTime())
        throw new ProjectsServiceError("PROJECT_MEMBER_CONFLICT");
      if(input.isPrimary===false && !mayRemovePrimaryProjectMentor(project.status,fresh.role,fresh.isPrimary))
        throw new ProjectsServiceError("PROJECT_INVALID_STATE");
      if(input.isPrimary===true&&fresh.role!=="MENTOR")
        throw new ProjectsServiceError("PROJECT_MEMBER_ROLE_REQUIRED");
      const roleKind=input.roleKind??fresh.roleKind;
      const canMutate=input.canMutate??fresh.canMutate;
      if((fresh.role==="LEARNER" && !["LEARNER","OBSERVER","REVIEWER","QA"].includes(roleKind))||
         (fresh.role==="MENTOR" && roleKind==="LEARNER")||
         (["OBSERVER","REVIEWER","QA"].includes(roleKind)&&canMutate)||
         (fresh.isPrimary && project.status==="ACTIVE" && (roleKind!=="MENTOR" || !canMutate))||
         (input.isPrimary===true && (roleKind!=="MENTOR" || !canMutate)))
        throw new ProjectsServiceError("PROJECT_MEMBER_ROLE_REQUIRED");
      const [changed]=await tx.update(projectMembers).set({
        ...(input.isPrimary!==undefined?{isPrimary:input.isPrimary}:{}),
        ...(input.roleLabel!==undefined?{roleLabel:input.roleLabel}:{}),
        ...(input.roleKind!==undefined?{roleKind:input.roleKind}:{}),
        ...(input.canMutate!==undefined?{canMutate:input.canMutate}:{}),
        updatedAt:new Date(Math.max(Date.now(),fresh.updatedAt.getTime()+1)),
      }).where(and(eq(projectMembers.id,fresh.id),
        eq(projectMembers.projectId,scope.project.id),isNull(projectMembers.endedAt)))
        .returning();
      if(!changed)throw new ProjectsServiceError("PROJECT_MEMBER_NOT_FOUND");
      const event=await recordActivityEventInTransaction(tx,context,projectTeamAuditInput("UPDATED",{
        projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
      },changed,randomUUID()));
      await notifyProjectMemberships(tx,event.id,{
        projectId:scope.project.id,collegeId:scope.collegeId,
        membershipIds:[changed.membershipId],exceptUserId:context.user.id,
        title:"Project role updated",body:"Your project role or permissions have changed.",
        actionHref:(changed.role==="MENTOR"?"/mentor/projects/":"/learn/projects/")+scope.project.id+"?tab=team",
      });
      return [changed];
    });
    return updated;
  } catch (error) {
    throw mapMemberConstraint(error);
  }
}

export async function endProjectMember(
  context: RequestContext,
  projectIdInput: string,
  memberIdInput: string,
) {
  const scope=await requireProjectReadAccess(context,projectIdInput);
  const mentorAction=scope.access==="MENTOR";
  if(!mentorAction&&scope.access!=="ADMIN")
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const memberId =
    projectMemberIdSchema.parse(memberIdInput);
  const member = await loadActiveProjectMember(
    scope.project.id,
    memberId,
  );

  return getDb().transaction(async tx => {
    const [project] = await tx.select({ teamGroupId: projectInstances.teamGroupId,status:projectInstances.status,deletedAt:projectInstances.deletedAt })
      .from(projectInstances).where(eq(projectInstances.id, scope.project.id)).for("update");
    if(!project||project.deletedAt||["ARCHIVED","COMPLETED"].includes(project.status))throw new ProjectsServiceError("PROJECT_INVALID_STATE");
    if(mentorAction)
      await assertPersistedProjectMutationActor(tx,context,scope);
    else
      await assertPersistedPlatformPermission(tx,context,"projects.manage",{
        collegeId:scope.collegeId,organizationId:scope.organizationId,
      });
    if (member.role === "LEARNER" && project.teamGroupId)
      throw new ProjectsServiceError("PROJECT_TEAM_GROUP_MANAGED");
    const [fresh] = await tx.select().from(projectMembers)
      .where(and(eq(projectMembers.id,member.id),eq(projectMembers.projectId,scope.project.id),
        isNull(projectMembers.endedAt)))
      .for("update");
    if (!fresh) throw new ProjectsServiceError("PROJECT_MEMBER_NOT_FOUND");
    if(mentorAction&&fresh.role!=="LEARNER")
      throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
    if (!project || !mayRemovePrimaryProjectMentor(project.status,fresh.role,fresh.isPrimary))
      throw new ProjectsServiceError("PROJECT_INVALID_STATE");
    const now = new Date();
    const [ended] = await tx.update(projectMembers)
      .set({endedAt:now,deletedAt:now,deletedByWorkspace:false,
        legacyMemberStatus:"REMOVED",isPrimary:false,updatedAt:now})
      .where(and(eq(projectMembers.id, fresh.id),
        eq(projectMembers.projectId,scope.project.id),isNull(projectMembers.endedAt)))
      .returning();
    if(!ended)throw new ProjectsServiceError("PROJECT_MEMBER_NOT_FOUND");
    // Keep completed task ownership as immutable history. Unfinished tasks
    // must not remain assigned to a learner whose project membership ended.
    // This update and its audit events share the project/member row locks and
    // the same transaction as the membership change.
    const unassigned=fresh.role==="LEARNER"?await tx.update(projectTasks).set({
      assigneeMembershipId:null,
      updatedAt:sql`greatest(${projectTasks.updatedAt} + interval '1 millisecond', now())`,
    }).where(and(
      eq(projectTasks.projectId,scope.project.id),
      eq(projectTasks.assigneeMembershipId,fresh.membershipId),
      isNull(projectTasks.deletedAt),
      ne(projectTasks.status,"DONE"),
    )).returning({id:projectTasks.id,title:projectTasks.title}):[];
    const event = await recordActivityEventInTransaction(tx,context,projectTeamAuditInput("ENDED",{
      projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
    },ended));
    for(const task of unassigned){
      await recordActivityEventInTransaction(tx,context,{
        eventType:ACTIVITY_EVENT_TYPES.PROJECTS_TASK_DETAILS_UPDATED,
        collegeId:scope.collegeId,organizationId:scope.organizationId,
        subjectType:"project_task",subjectId:task.id,subjectLabel:task.title,
        summary:"Unfinished task unassigned after project learner removal",
        metadata:{projectId:scope.project.id,taskId:task.id,
          previousAssigneeMembershipId:ended.membershipId,sourceTab:"board"},
        groupKey:"project:"+scope.project.id+":tasks",
        dedupeKey:"project-member-unassign:"+ended.id+":"+task.id,
      });
    }
    if(unassigned.length)await notifyActiveProjectMembers(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,
      roles:["MENTOR"],
      title:"Tasks need reassignment",
      body:unassigned.length+" unfinished project "+
        (unassigned.length===1?"task is":"tasks are")+
        " unassigned following a team membership change.",
      actionHref:"/mentor/projects/"+scope.project.id+"?tab=board&scope=all&assignee=UNASSIGNED",
    });
    await notifyProjectMemberships(tx,event.id,{
      projectId:scope.project.id,collegeId:scope.collegeId,
      membershipIds:[ended.membershipId],title:"Removed from project",
      body:"Your membership in "+scope.project.title+" has ended.",
      actionHref:(ended.role==="MENTOR"?"/mentor/projects/":"/learn/projects/")+scope.project.id,
    });
    return ended;
  });
}

export async function listProjectMembers(
  context: RequestContext,
  projectIdInput: string,
) {
  const scope =
    await requireProjectReadAccess(
      context,
      projectIdInput,
    );

  return getDb()
    .select({
      id: projectMembers.id,
      membershipId: projectMembers.membershipId,
      userId:users.id,
      role: projectMembers.role,
      roleKind: projectMembers.roleKind,
      canMutate: projectMembers.canMutate,
      isPrimary: projectMembers.isPrimary,
      roleLabel: projectMembers.roleLabel,
      displayName:sql<string>`coalesce(nullif(${projectMembers.legacyDisplayName},''),${users.displayName})`,
      legacyDisplayName:projectMembers.legacyDisplayName,
      legacyUserType:projectMembers.legacyUserType,
      legacyMemberId:projectMembers.legacyMemberId,
      legacyVersion:projectMembers.legacyVersion,
      memberStatus:sql<string>`coalesce(nullif(${projectMembers.legacyMemberStatus},''),'ACTIVE')`,
      deletedByWorkspace:projectMembers.deletedByWorkspace,
      startedAt:projectMembers.startedAt,
    })
    .from(projectMembers)
    .innerJoin(
      collegeMemberships,
      eq(
        collegeMemberships.id,
        projectMembers.membershipId,
      ),
    )
    .innerJoin(
      users,
      eq(users.id, collegeMemberships.userId),
    )
    .innerJoin(
      membershipRoles,
      and(
        eq(membershipRoles.membershipId,collegeMemberships.id),
        sql`CAST(${membershipRoles.role} AS text) = ${projectMembers.role}`,
      ),
    )
    .where(
      and(
        eq(projectMembers.projectId,scope.project.id),
        isNull(projectMembers.endedAt),
        eq(collegeMemberships.collegeId,scope.collegeId),
        eq(collegeMemberships.status,"ACTIVE"),
        eq(users.platformStatus,"ACTIVE"),
      ),
    )
    .orderBy(
      asc(projectMembers.role),
      asc(users.displayName),
    );
}


/** Filter and page the scoped learner directory in SQL before loading per-card
 * summaries. A stale membership/role never becomes a successful empty page. */
export async function listMyLearnerProjectPage(
 context:RequestContext,
 query:{search?:string;status?:string;attention?:string;work?:string;sort?:string;page?:number;pageSize?:number},
){
 const membership=context.membership;
 if(context.user.platformStatus!=="ACTIVE"||!membership||membership.status!=="ACTIVE")
  throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const db=getDb();
 const [authorized]=await db.select({id:collegeMemberships.id}).from(collegeMemberships)
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"LEARNER")))
  .where(and(eq(collegeMemberships.id,membership.id),
   eq(collegeMemberships.userId,context.user.id),eq(collegeMemberships.collegeId,membership.collegeId),
   eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"))).limit(1);
 if(!authorized)throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const base=and(
  eq(projectMembers.membershipId,membership.id),eq(projectMembers.role,"LEARNER"),
  isNull(projectMembers.endedAt),eq(projectInstances.collegeId,membership.collegeId),
  isNull(projectInstances.deletedAt),
  eq(collegeMemberships.collegeId,membership.collegeId),
  eq(collegeMemberships.userId,context.user.id),eq(collegeMemberships.status,"ACTIVE"),
  eq(users.platformStatus,"ACTIVE"),eq(membershipRoles.role,"LEARNER"),
 );
 const taskTotal=sql<number>`(select count(*)::int from project_tasks pt where pt.project_id=${projectInstances.id} and pt.deleted_at is null)`;
 const taskDone=sql<number>`(select count(*)::int from project_tasks pt where pt.project_id=${projectInstances.id} and pt.deleted_at is null and pt.status='DONE')`;
 const taskBlocked=sql<number>`(select count(*)::int from project_tasks pt where pt.project_id=${projectInstances.id} and pt.deleted_at is null and pt.status='BLOCKED')`;
 const live=sql<boolean>`${projectInstances.status} not in ('COMPLETED','ARCHIVED')`;
 const blocked=sql<boolean>`(${projectInstances.blocker} is not null and btrim(${projectInstances.blocker}) <> '' or ${taskBlocked} > 0)`;
 const conditions=[];
 if(query.search?.trim()){
  const search=containsLikePattern(query.search.trim());
  conditions.push(or(
   ilike(projectInstances.title,search),ilike(projectInstances.slug,search),
   ilike(projectInstances.summary,search),ilike(projectInstances.courseLabel,search),
   sql<boolean>`exists(select 1 from project_members mentors
    join college_memberships cm on cm.id=mentors.membership_id
    join users mentor_users on mentor_users.id=cm.user_id
    where mentors.project_id=${projectInstances.id} and mentors.ended_at is null
    and mentors.role='MENTOR' and cm.college_id=${membership.collegeId}
    and cm.status='ACTIVE' and mentor_users.platform_status='ACTIVE'
    and mentor_users.display_name ilike ${search})`,
  ));
 }
 if(query.status==="CURRENT")conditions.push(live);
 else if(query.status==="IN_PROGRESS")conditions.push(and(eq(projectInstances.status,"ACTIVE"),sql`${taskDone} > 0`));
 else if(query.status==="READY")conditions.push(eq(projectInstances.status,"COMPLETED"));
 else if(query.status==="BLOCKED")conditions.push(and(live,blocked));
 else if(query.status)conditions.push(eq(projectInstances.status,query.status));
 if(query.attention==="LEARNER_ACTION")conditions.push(and(
  sql`${projectInstances.status} <> 'ARCHIVED'`,
  sql`(select ps.status from project_submissions ps where ps.project_id=${projectInstances.id} order by ps.version desc limit 1) in ('DRAFT','CHANGES_REQUESTED')`,
 ));
 else if(query.attention==="BLOCKED")conditions.push(and(live,blocked));
 if(query.work==="BLOCKED")conditions.push(and(live,sql`${taskBlocked} > 0`));
 if(query.work==="NO_TASKS")conditions.push(and(live,sql`${taskTotal} = 0`));
 const filtered=and(base,...conditions);
 // Reapply the same membership-and-role joins to all three SQL reads.
 // Neither search input nor a direct page URL may expand the tenant scope.
 const [assignedCount]=await db.select({count:sql<number>`count(*)::int`})
  .from(projectMembers).innerJoin(projectInstances,eq(projectInstances.id,projectMembers.projectId))
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
  .where(base);
 const [filteredCount]=await db.select({count:sql<number>`count(*)::int`})
  .from(projectMembers).innerJoin(projectInstances,eq(projectInstances.id,projectMembers.projectId))
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
  .where(filtered);
 const total=Number(filteredCount?.count??0);
 const pageSize=query.pageSize===10||query.pageSize===50?query.pageSize:25;
 const totalPages=Math.max(1,Math.ceil(total/pageSize));
 const page=Math.min(Math.max(1,query.page??1),totalPages);
 const order=query.sort==="TITLE"
  ? [sql`case when ${projectInstances.status} = 'ARCHIVED' then 1 else 0 end`,asc(projectInstances.title),asc(projectInstances.id)]
  :query.sort==="PROGRESS"
   ? [sql`case when ${projectInstances.status} = 'ARCHIVED' then 1 else 0 end`,
      sql`case when ${taskTotal}=0 then null else ${taskDone}::numeric / nullif(${taskTotal},0) end asc nulls last`,
      desc(projectInstances.updatedAt),asc(projectInstances.id)]
   : [sql`case when ${projectInstances.status} = 'ARCHIVED' then 1 else 0 end`,
      desc(projectInstances.updatedAt),asc(projectInstances.id)];
 const rows=await db.select({
  memberId:projectMembers.id,memberRole:projectMembers.role,
  isPrimaryMentor:projectMembers.isPrimary,project:projectInstances,
 }).from(projectMembers)
  .innerJoin(projectInstances,eq(projectInstances.id,projectMembers.projectId))
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
  .innerJoin(users,eq(users.id,collegeMemberships.userId))
  .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
  .where(filtered).orderBy(...order).limit(pageSize).offset((page-1)*pageSize);
 return {rows,total,assignedCount:Number(assignedCount?.count??0),page,pageSize,totalPages};
}

/** Read-only legacy GET /api/v1/projects/me/page bridge.
 * Page and size are bounded before the database query. The same current
 * membership / role / tenant predicates as the native learner directory
 * apply to records and totalRecords; zero-based paging is a wire alias only.
 */
export async function listMyProjectInstancesLegacyPage(
 context:RequestContext,query:{
  page0?:number;size?:10|25|50;search?:string;status?:string;attention?:string;
 }){
 const page0=query.page0??0;
 const size=query.size??25;
 if(!Number.isSafeInteger(page0)||page0<0||page0>99999||
    ![10,25,50].includes(size)||query.search&&query.search.length>100)
   throw new ProjectsServiceError("PROJECT_INVALID_STATE");
 const page=await listMyLearnerProjectPage(context,{
  ...(query.search !== undefined ? {search:query.search} : {}),
   ...(query.status !== undefined ? {status:query.status} : {}),
   ...(query.attention !== undefined ? {attention:query.attention} : {}),
  page:page0+1,pageSize:size,
 });
 return {
  records:page.rows,
  totalRecords:page.total,
  totalPages:page.totalPages,
  page0:page.page-1,
  size:page.pageSize,
 };
}

export async function listMyProjectInstances(
  context: RequestContext,
) {
  const membership = context.membership;
  if (
    context.user.platformStatus !== "ACTIVE" ||
    !membership ||
    membership.status !== "ACTIVE"
  ) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  // Never trust the request-context membership/college pair as-is: a forged
  // college must be a denial, not an empty (successful-looking) project list.
  const [persisted] = await getDb()
    .select({ id: collegeMemberships.id })
    .from(collegeMemberships)
    .where(and(
      eq(collegeMemberships.id, membership.id),
      eq(collegeMemberships.userId, context.user.id),
      eq(collegeMemberships.collegeId, membership.collegeId),
      eq(collegeMemberships.status, "ACTIVE"),
    ))
    .limit(1);
  if (!persisted) {
    throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  }
  // Do not trust an old project_members assignment as authorization after
  // revoking the user's LEARNER/MENTOR role or suspending their account.
  return getDb()
    .select({
      memberId: projectMembers.id,
      memberRole: projectMembers.role,
      memberRoleKind:projectMembers.roleKind,
      memberCanMutate:projectMembers.canMutate,
      isPrimaryMentor: projectMembers.isPrimary,
      project: projectInstances,
    })
    .from(projectMembers)
    .innerJoin(projectInstances,eq(projectInstances.id,projectMembers.projectId))
    .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,and(
      eq(membershipRoles.membershipId,collegeMemberships.id),
      sql`CAST(${membershipRoles.role} AS text) = ${projectMembers.role}`,
    ))
    .where(and(
      eq(projectMembers.membershipId,membership.id),
      isNull(projectMembers.endedAt),
      eq(projectInstances.collegeId,membership.collegeId),
      eq(collegeMemberships.collegeId,membership.collegeId),
      eq(collegeMemberships.userId,context.user.id),
      eq(collegeMemberships.status,"ACTIVE"),
      eq(users.platformStatus,"ACTIVE"),
    ))
    .orderBy(asc(projectInstances.title));
}
