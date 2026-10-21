import "server-only";
import {and,eq,exists,inArray,isNull,sql} from "drizzle-orm";
import {replaceCollegeProjectRosterSchema} from "./college-project-roster-model";
import {getDb} from "@/db/client";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {collegeMemberships,learnerProgramEnrollments,sectionEnrollments,membershipRoles,projectInstances,projectMembers,users} from "@/db/schema";
import {ProjectsServiceError} from "./errors";
import {requireProjectManageAccess} from "./access";
import {projectTeamAuditInput} from "./mentor-team-audit-model";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {notifyProjectMemberships} from "./project-notification-service";
import type {RequestContext} from "@/modules/identity/context";

/** COL-projects-15: one all-or-nothing learner-roster replacement. Class teams stay managed by their own workflow. */
export async function replaceCollegeProjectLearners(context:RequestContext,projectId:string,raw:unknown){
 // Additive by default; explicit replacement/removal is authorized inside the transaction.
 const input=replaceCollegeProjectRosterSchema.parse(raw);
 const scope=await requireProjectManageAccess(context,projectId);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({
   id:projectInstances.id,teamGroupId:projectInstances.teamGroupId,sectionId:projectInstances.sectionId,
   status:projectInstances.status,updatedAt:projectInstances.updatedAt,
  }).from(projectInstances).where(and(eq(projectInstances.id,scope.project.id),
   eq(projectInstances.collegeId,scope.collegeId))).for("update").limit(1);
  if(!project||project.teamGroupId||project.status==="ARCHIVED")
   throw new ProjectsServiceError("PROJECT_INVALID_STATE");
  // A stale request context cannot authorize a change after account disable,
  // role removal, tenant switch or membership suspension. Serialize this check
  // with the locked project and membership rows in the mutation transaction.
  await assertPersistedPlatformPermission(tx,context,"projects.manage",{
   collegeId:scope.collegeId,organizationId:scope.organizationId,
  });
  const existing=await tx.select().from(projectMembers)
   .where(and(eq(projectMembers.projectId,scope.project.id),isNull(projectMembers.endedAt)))
   .for("update");
  const existingLearners=existing.filter(x=>x.role==="LEARNER");
  const selected=new Set(input.learnerMembershipIds);
  const toRemove=input.mode==="REPLACE"
   ?existingLearners.filter(x=>!selected.has(x.membershipId)):[];
  if(toRemove.length && input.confirmRemoval!==true)
   throw new ProjectsServiceError("PROJECT_MEMBER_CONFLICT");
  if(existingLearners.length-toRemove.length+
      input.learnerMembershipIds.filter(id=>!existingLearners.some(member=>member.membershipId===id)).length>500)
   throw new ProjectsServiceError("PROJECT_MEMBER_CONFLICT");
  const learnerIds=new Set(existingLearners.map(x=>x.membershipId));
  const toAdd=input.learnerMembershipIds.filter(id=>!learnerIds.has(id));
  if(toAdd.some(id=>existing.some(x=>x.membershipId===id)))
   throw new ProjectsServiceError("PROJECT_MEMBER_CONFLICT");
  if(toAdd.length){
   const eligible=await tx.select({id:collegeMemberships.id})
    .from(collegeMemberships)
    .innerJoin(users,eq(users.id,collegeMemberships.userId))
    .innerJoin(membershipRoles,and(eq(membershipRoles.membershipId,collegeMemberships.id),
      eq(membershipRoles.role,"LEARNER")))
    // Adding students must enforce the same academic enrolment rules as
    // initial workspace creation; membership role alone is not eligibility.
    .innerJoin(learnerProgramEnrollments,and(
      eq(learnerProgramEnrollments.membershipId,collegeMemberships.id),
      eq(learnerProgramEnrollments.status,"ACTIVE")))
    .where(and(inArray(collegeMemberships.id,toAdd),eq(collegeMemberships.collegeId,scope.collegeId),
      eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE"),
      // Section-bound workspaces require a live enrollment in that section,
      // not merely an active enrollment in some other section or term.
      // Explicitly qualify the outer enrollment ID inside the correlated
      // subquery so PostgreSQL cannot resolve it as the inner row ID.
      project.sectionId?exists(tx.select({id:sectionEnrollments.id})
        .from(sectionEnrollments).where(and(
          eq(sectionEnrollments.learnerEnrollmentId,sql.raw('"learner_program_enrollments"."id"')),
          eq(sectionEnrollments.sectionId,project.sectionId),
          eq(sectionEnrollments.status,"ACTIVE"),
        ))):undefined));
   if(new Set(eligible.map(x=>x.id)).size!==toAdd.length)
    throw new ProjectsServiceError("PROJECT_MEMBER_ROLE_REQUIRED");
  }
  // A completed request retried after a timeout is a no-op, even if its
  // original optimistic token is now stale. No notifications are repeated.
  if(toAdd.length===0&&toRemove.length===0)return {added:0,removed:0,updatedAt:project.updatedAt.toISOString()};
  if(project.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
   throw new ProjectsServiceError("PROJECT_MEMBER_CONFLICT");
  const now=new Date(Math.max(Date.now(),project.updatedAt.getTime()+1));
  for(const member of toRemove){
   const [ended]=await tx.update(projectMembers).set({endedAt:now,isPrimary:false,updatedAt:now})
    .where(and(eq(projectMembers.id,member.id),isNull(projectMembers.endedAt))).returning();
   if(!ended)throw new ProjectsServiceError("PROJECT_MEMBER_CONFLICT");
   const event=await recordActivityEventInTransaction(tx,context,projectTeamAuditInput("ENDED",{
    projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
   },ended));
   await notifyProjectMemberships(tx,event.id,{projectId:scope.project.id,collegeId:scope.collegeId,
    membershipIds:[ended.membershipId],title:"Removed from project",
    body:"Your membership in "+scope.project.title+" has ended.",actionHref:"/learn/projects/"+scope.project.id});
  }
  for(const membershipId of toAdd){
   const [added]=await tx.insert(projectMembers).values({
    projectId:scope.project.id,membershipId,role:"LEARNER",roleKind:"LEARNER",
    canMutate:true,isPrimary:false,roleLabel:input.roleLabel??null,createdByUserId:context.user.id,
   }).returning();
   if(!added)throw new ProjectsServiceError("PROJECT_MEMBER_CONFLICT");
   const event=await recordActivityEventInTransaction(tx,context,projectTeamAuditInput("ADDED",{
    projectId:scope.project.id,collegeId:scope.collegeId,organizationId:scope.organizationId,
   },added));
   await notifyProjectMemberships(tx,event.id,{projectId:scope.project.id,collegeId:scope.collegeId,
    membershipIds:[membershipId],title:"Added to project",
    body:"You have been added to "+scope.project.title+".",actionHref:"/learn/projects/"+scope.project.id});
  }
  const [updated]=await tx.update(projectInstances).set({updatedAt:now})
   .where(eq(projectInstances.id,scope.project.id)).returning({updatedAt:projectInstances.updatedAt});
  if(!updated)throw new ProjectsServiceError("PROJECT_MEMBER_CONFLICT");
  return {added:toAdd.length,removed:toRemove.length,updatedAt:updated.updatedAt.toISOString()};
 });
}
