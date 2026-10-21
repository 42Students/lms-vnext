import { and, eq, isNull, asc, inArray, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import {
  collegeMemberships, cohorts, departments, learnerProfiles, learnerProgramEnrollments,
  lmsGroups, lmsGroupMembers, membershipRoles, programs, projectInstances, projectMembers,
  projectReleases, projectResources, projectSprints, projectTasks, projectTemplateCollegeAssignments,
  projectTemplates, projectTemplateVersions, sectionEnrollments, sections, users,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { isSuperAdmin } from "@/modules/identity/context";
import { ACTIVITY_EVENT_TYPES } from "@/modules/activity/taxonomy";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { createClassTeamWorkspacesSchema } from "./class-team-create-request";
import { verifyClassTeamPreview } from "./class-team-preview-validation";
import { previewVersion } from "./class-team-preview-token";
import { classRosterRevision, loadClassTeamRoster, requireTeamCreationAuthority } from "./class-team-roster-service";
import { classTeamCapacity } from "./class-team-capacity";
import {cohortCreationResultRows} from "./cohort-creation-outcome-model";
import { planClassTeamWorkspaceNames } from "./class-team-workspace-names";
import { publishableProjectTemplateBlueprintSchema } from "./validation";
import { ProjectsServiceError, postgresConstraintName, isRetryableProjectTransactionError } from "./errors";

export async function createClassTeamWorkspaces(context: RequestContext, raw: unknown) {
  const input = createClassTeamWorkspacesSchema.parse(raw);
  const scope = await requireTeamCreationAuthority(context, input.collegeId);
  // Only the persisted current class may be used; the browser cannot supply learners.
  await loadClassTeamRoster(context, scope.id, input.classId);
  const db = getDb();
  // Each retry is a fresh SERIALIZABLE transaction. No partial work survives
  // PostgreSQL 40001/40P01, and cohortMode recomputes covered learners.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await db.transaction(async tx => {
      const [section] = await tx.select({ id: sections.id })
        .from(sections).innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
        .innerJoin(programs,eq(programs.id,cohorts.programId))
        .innerJoin(departments,eq(departments.id,programs.departmentId))
        .where(and(eq(sections.id,input.classId),eq(sections.status,"ACTIVE"),eq(departments.collegeId,scope.id)))
        .for("share").limit(1);
      if (!section) throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
      // Rebuild the actor's permissions from persisted rows in the *same*
      // SERIALIZABLE transaction as team/project creation. The preflight
      // RequestContext may have expired or lost its COLLEGE_ADMIN role while
      // the user reviewed a preview in another tab.
      const persistedActor = await assertPersistedPlatformPermission(
        tx, context, "projects.manage", {
          collegeId: scope.id, organizationId: scope.organizationId,
        },
      );
      const rows = await tx.select({
        membershipId: collegeMemberships.id, rollNumber: learnerProfiles.rollNumber,
        registrationNumber: learnerProfiles.registrationNumber,
      }).from(sectionEnrollments)
        .innerJoin(learnerProgramEnrollments,eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId))
        .innerJoin(collegeMemberships,eq(collegeMemberships.id,learnerProgramEnrollments.membershipId))
        .innerJoin(users,eq(users.id,collegeMemberships.userId))
        .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"LEARNER")))
        .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
        .where(and(eq(sectionEnrollments.sectionId,section.id),eq(sectionEnrollments.status,"ACTIVE"),
          eq(learnerProgramEnrollments.status,"ACTIVE"),eq(collegeMemberships.collegeId,scope.id),
          eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")))
        .orderBy(asc(collegeMemberships.id)).limit(2001);
      if (!rows.length || rows.length>2000) throw new ProjectsServiceError("PROJECT_CLASS_ROSTER_UNSUPPORTED");
      const members=rows.map(r=>({membershipId:r.membershipId,rollNumber:(r.rollNumber||r.registrationNumber||r.membershipId).slice(0,80)}))
        .sort((a,b)=>a.rollNumber.localeCompare(b.rollNumber,undefined,{numeric:true})||a.membershipId.localeCompare(b.membershipId));
      if (new Set(members.map(m=>m.membershipId)).size !== members.length) throw new ProjectsServiceError("PROJECT_CLASS_ROSTER_DUPLICATE");
      // CAS before any work, including a possible retry with the same base slug.
      if (classRosterRevision(section.id,members)!==input.rosterRevision) throw new ProjectsServiceError("PROJECT_CLASS_ROSTER_STALE");
      if (previewVersion(input.teams)!==input.expectedPreviewVersion) throw new ProjectsServiceError("PROJECT_TEAM_PREVIEW_STALE");
      let groups: ReturnType<typeof verifyClassTeamPreview>;
      try { groups=verifyClassTeamPreview(input.teams,members.map(m=>m.membershipId)); }
      catch { throw new ProjectsServiceError("PROJECT_TEAM_PREVIEW_INVALID"); }
      if(input.cohortMode && groups.some(group=>group.membershipIds.length!==1))
        throw new ProjectsServiceError("PROJECT_TEAM_PREVIEW_INVALID");
      const capacity=classTeamCapacity(groups);
      if (!capacity.balanced) throw new ProjectsServiceError("PROJECT_TEAM_UNBALANCED");
      const plans=planClassTeamWorkspaceNames(input.baseTitle,input.baseSlug,groups);

      const [assigned]=await tx.select({
        templateId:projectTemplates.id, versionId:projectTemplateVersions.id,
        summary:projectTemplateVersions.summary, blueprint:projectTemplateVersions.blueprint,
      }).from(projectTemplateCollegeAssignments)
        .innerJoin(projectTemplates,eq(projectTemplates.id,projectTemplateCollegeAssignments.templateId))
        .innerJoin(projectTemplateVersions,and(eq(projectTemplateVersions.id,projectTemplateCollegeAssignments.templateVersionId),eq(projectTemplateVersions.templateId,projectTemplateCollegeAssignments.templateId)))
        .where(and(eq(projectTemplateCollegeAssignments.collegeId,scope.id),eq(projectTemplateCollegeAssignments.templateId,input.templateId),
          isNull(projectTemplateCollegeAssignments.revokedAt),eq(projectTemplates.status,"PUBLISHED")))
        .for("share").limit(1);
      if (!assigned) throw new ProjectsServiceError("PROJECT_TEMPLATE_NOT_ASSIGNED");
      const blueprint=publishableProjectTemplateBlueprintSchema.parse(assigned.blueprint);
      if(input.initialStatus==="ACTIVE"&&!input.primaryMentorMembershipId)
        throw new ProjectsServiceError("PROJECT_MEMBER_ROLE_REQUIRED");
      if (input.primaryMentorMembershipId) {
        const [mentor]=await tx.select({id:collegeMemberships.id}).from(collegeMemberships)
          .innerJoin(users,eq(users.id,collegeMemberships.userId))
          .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),eq(membershipRoles.role,"MENTOR")))
          .where(and(eq(collegeMemberships.id,input.primaryMentorMembershipId),eq(collegeMemberships.collegeId,scope.id),
            eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"))).for("share").limit(1);
        if (!mentor) throw new ProjectsServiceError("PROJECT_MEMBER_ROLE_REQUIRED");
      }
      const covered=input.cohortMode?new Set((await tx.select({membershipId:projectMembers.membershipId})
        .from(projectMembers).innerJoin(projectInstances,eq(projectInstances.id,projectMembers.projectId))
        .where(and(eq(projectInstances.collegeId,scope.id),
          eq(projectInstances.sectionId,section.id),eq(projectInstances.templateId,input.templateId),
          ne(projectInstances.status,"ARCHIVED"),eq(projectMembers.role,"LEARNER"),
          isNull(projectMembers.endedAt),inArray(projectMembers.membershipId,members.map(m=>m.membershipId)))))
        .map(row=>row.membershipId)):new Set<string>();
      const created: {projectId:string;teamGroupId:string;title:string;memberCount:number;learnerMembershipId:string}[]=[];
      for (let index=0;index<plans.length;index++) {
        const plan=plans[index],group=groups[index];
        if(input.cohortMode && covered.has(group.membershipIds[0]))continue;
        const [team]=await tx.insert(lmsGroups).values({
          kind:"PROJECT_TEAM",ownerScope:"COLLEGE",collegeId:scope.id,
          name:(input.baseTitle.slice(0,20)+" · "+group.name),status:"ACTIVE",
          capacity:plan.membershipIds.length,activeCount:plan.membershipIds.length,
          configJson:{classId:section.id,managedBy:"PROJECT_WORKSPACE"},
          createdByUserId:context.user.id,createdByType:isSuperAdmin(persistedActor)?"SUPER_ADMIN":"COLLEGE_ADMIN",
        }).returning({id:lmsGroups.id});
        if (!team) throw new Error("Team insert failed");
        await tx.insert(lmsGroupMembers).values(plan.membershipIds.map(membershipId=>({
          groupId:team.id,membershipId,memberType:"LEARNER",state:"ACTIVE",
          source:"MANUAL",joinedAt:new Date(),
        })));
        const [project]=await tx.insert(projectInstances).values({
          collegeId:scope.id,templateId:assigned.templateId,templateVersionId:assigned.versionId,
          teamGroupId:team.id,sectionId:section.id,slug:plan.slug,title:plan.title,summary:assigned.summary,
          createdByUserId:context.user.id,status:input.initialStatus,phase:input.initialPhase??null,
        }).returning({id:projectInstances.id,title:projectInstances.title});
        if (!project) throw new Error("Workspace insert failed");
        await tx.insert(projectMembers).values([
          ...plan.membershipIds.map(membershipId=>({
            projectId:project.id,membershipId,role:"LEARNER",roleKind:"LEARNER",canMutate:true,isPrimary:false,
            createdByUserId:context.user.id,
          })),
          ...(input.primaryMentorMembershipId?[{
            projectId:project.id,membershipId:input.primaryMentorMembershipId,
            role:"MENTOR",roleKind:"MENTOR",canMutate:true,isPrimary:true,roleLabel:"Project Mentor",createdByUserId:context.user.id,
          }]:[]),
        ]);
        const releases=await tx.insert(projectReleases).values(blueprint.releases.map(r=>({
          projectId:project.id,templateKey:r.key,title:r.title,description:r.description??null,sequence:r.sequence,
        }))).returning({id:projectReleases.id,key:projectReleases.templateKey});
        const releaseIds=new Map(releases.map(r=>[r.key,r.id]));
        const sprints=await tx.insert(projectSprints).values(blueprint.sprints.map(s=>{
          const releaseId=releaseIds.get(s.releaseKey);
          if(!releaseId)throw new Error("Sprint release key unresolved");
          return {projectId:project.id,releaseId,templateKey:s.key,title:s.title,description:s.description??null,sequence:s.sequence};
        })).returning({id:projectSprints.id,key:projectSprints.templateKey});
        const sprintIds=new Map(sprints.map(s=>[s.key,s.id]));
        await tx.insert(projectTasks).values(blueprint.tasks.map(t=>{
          const sprintId=sprintIds.get(t.sprintKey);
          if(!sprintId)throw new Error("Task sprint key unresolved");
          return {projectId:project.id,sprintId,templateKey:t.key,title:t.title,description:t.description??null,acceptanceCriteria:t.acceptanceCriteria??null,priority:t.priority,sequence:t.sequence};
        }));
        if(blueprint.resources.length)await tx.insert(projectResources).values(blueprint.resources.map(r=>({
          projectId:project.id,templateKey:r.key,title:r.title,description:r.description??null,
          url:r.url??null,required:r.required,sequence:r.sequence,
        })));
        await recordActivityEventInTransaction(tx,context,{
          eventType:ACTIVITY_EVENT_TYPES.PROJECTS_PROJECT_CREATED,
          collegeId:scope.id,organizationId:scope.organizationId,subjectType:"project",
          subjectId:project.id,subjectLabel:project.title,summary:"Class team Project workspace created",
          metadata:{projectId:project.id,classId:section.id,teamGroupId:team.id,memberCount:group.membershipIds.length},
          groupKey:"project:"+project.id,dedupeKey:"project:"+project.id+":created",
        });
        created.push({projectId:project.id,teamGroupId:team.id,title:project.title,
          memberCount:group.membershipIds.length,learnerMembershipId:group.membershipIds[0]});
      }
      const individualResults=input.cohortMode?
        cohortCreationResultRows(groups,created,covered):[];
      return {created,teamCount:created.length,learnerCount:members.length,
        alreadyCovered:covered.size,requested:groups.length,individualResults};
      },{isolationLevel:"serializable"});
    } catch(error) {
      if(postgresConstraintName(error)==="project_instances_college_slug_uq")
        throw new ProjectsServiceError("PROJECT_SLUG_CONFLICT");
      if(isRetryableProjectTransactionError(error)) {
        if(attempt < 2) continue;
        // A stale roster/parallel edit is actionable and must never expose
        // raw 40001 or 40P01 SQL error internals to the caller.
        throw new ProjectsServiceError("PROJECT_CLASS_ROSTER_STALE");
      }
      throw error;
    }
  }
  throw new ProjectsServiceError("PROJECT_CLASS_ROSTER_STALE");
}
