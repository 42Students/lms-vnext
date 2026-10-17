import "server-only";
import {and,eq,inArray,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,projectInstances,projectMembers,users} from "@/db/schema";
import {ProjectsServiceError} from "./errors";
import {requireProjectManageAccess} from "./access";
import {projectTeamAuditInput} from "./mentor-team-audit-model";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {notifyProjectMemberships} from "./project-notification-service";
import type {RequestContext} from "@/modules/identity/context";

export const replaceCollegeProjectRosterSchema=z.object({
 learnerMembershipIds:z.array(z.string().uuid()).max(100).refine(values=>new Set(values).size===values.length,
  "Each learner must be selected once."),
 roleLabel:z.string().trim().max(120).optional(),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
}).strict();

/** COL-projects-15: one all-or-nothing learner-roster replacement. Class teams stay managed by their own workflow. */
export async function replaceCollegeProjectLearners(context:RequestContext,projectId:string,raw:unknown){
 const input=replaceCollegeProjectRosterSchema.parse(raw);
 const scope=await requireProjectManageAccess(context,projectId);
 return getDb().transaction(async tx=>{
  const [project]=await tx.select({
   id:projectInstances.id,teamGroupId:projectInstances.teamGroupId,
   status:projectInstances.status,updatedAt:projectInstances.updatedAt,
  }).from(projectInstances).where(eq(projectInstances.id,scope.project.id)).for("update").limit(1);
  if(!project||project.teamGroupId||project.status==="ARCHIVED")
   throw new ProjectsServiceError("PROJECT_INVALID_STATE");
  if(project.updatedAt.getTime()!==Date.parse(input.expectedUpdatedAt))
   throw new ProjectsServiceError("PROJECT_MEMBER_CONFLICT");
  const existing=await tx.select().from(projectMembers)
   .where(and(eq(projectMembers.projectId,scope.project.id),isNull(projectMembers.endedAt)))
   .for("update");
  const existingLearners=existing.filter(x=>x.role==="LEARNER");
  const selected=new Set(input.learnerMembershipIds);
  const toRemove=existingLearners.filter(x=>!selected.has(x.membershipId));
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
    .where(and(inArray(collegeMemberships.id,toAdd),eq(collegeMemberships.collegeId,scope.collegeId),
      eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")));
   if(new Set(eligible.map(x=>x.id)).size!==toAdd.length)
    throw new ProjectsServiceError("PROJECT_MEMBER_ROLE_REQUIRED");
  }
  if(toAdd.length===0&&toRemove.length===0)return {added:0,removed:0,updatedAt:project.updatedAt.toISOString()};
  const now=new Date();
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
