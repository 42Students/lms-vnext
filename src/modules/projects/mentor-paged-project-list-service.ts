import "server-only";
import {and,asc,desc,eq,ilike,isNull,ne,or,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,projectInstances,projectMembers,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import type {MentorProjectListQuery} from "./mentor-project-list-query";
import {containsLikePattern} from "@/lib/sql-match";
import {ProjectsServiceError} from "./errors";

/** MEN-projects-meetings-10: DB-backed pagination for ordinary mentor list
 * filters; advanced attention/work sorts continue using their specific
 * rollup services until those filters are also SQL backed.
 */
export async function listPagedMentorProjects(context:RequestContext,query:MentorProjectListQuery){
 const membership=context.membership;
 if(!membership || membership.status!=="ACTIVE" ||
   !membership.roles.includes("MENTOR")||context.user.platformStatus!=="ACTIVE")
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 const conditions=[
   eq(projectMembers.membershipId,membership.id),
   eq(projectMembers.role,"MENTOR"),
   isNull(projectMembers.endedAt),
   eq(projectInstances.collegeId,membership.collegeId),
   eq(collegeMemberships.collegeId,membership.collegeId),
   eq(collegeMemberships.userId,context.user.id),
   eq(collegeMemberships.status,"ACTIVE"),
   eq(users.platformStatus,"ACTIVE"),
   eq(membershipRoles.role,"MENTOR"),
 ];
 if(query.search?.trim()){
   const term=containsLikePattern(query.search.trim());
   conditions.push(or(ilike(projectInstances.title,term),
     ilike(projectInstances.slug,term),
     ilike(projectInstances.courseLabel,term),
     ilike(projectInstances.summary,term))!);
 }
 if(query.assignment==="PRIMARY") conditions.push(eq(projectMembers.isPrimary,true));
 if(query.assignment==="SUPPORTING") conditions.push(eq(projectMembers.isPrimary,false));
 if(query.status==="CURRENT") conditions.push(ne(projectInstances.status,"ARCHIVED"));
 else if(query.status && ["PLANNED","ACTIVE","COMPLETED","ARCHIVED"].includes(query.status))
   conditions.push(eq(projectInstances.status,query.status as "PLANNED"|"ACTIVE"|"COMPLETED"|"ARCHIVED"));
 const [countRow]=await getDb().select({total:sql<number>`count(*)::int`})
   .from(projectMembers)
   .innerJoin(projectInstances,eq(projectInstances.id,projectMembers.projectId))
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
   .where(and(...conditions));
 const total=Number(countRow?.total??0);
 const pageSize=query.pageSize;
 const totalPages=Math.max(1,Math.ceil(total/pageSize));
 const page=Math.min(query.page,totalPages);
 const naturalTitle=sql`regexp_replace(lower(${projectInstances.title}), '[0-9]+',
     coalesce(lpad(substring(${projectInstances.title} from '[0-9]+'), 12, '0'), ''))`;
 const items=await getDb().select({
   memberId:projectMembers.id,memberRole:projectMembers.role,
   isPrimaryMentor:projectMembers.isPrimary,project:projectInstances,
 }).from(projectMembers)
   .innerJoin(projectInstances,eq(projectInstances.id,projectMembers.projectId))
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
   .where(and(...conditions))
   .orderBy(
      sql`case when ${projectInstances.status} = 'ARCHIVED' then 1 else 0 end`,
      ...(query.sort==="TITLE"?
        [naturalTitle,asc(projectInstances.id)]:
        [desc(projectInstances.updatedAt),naturalTitle,asc(projectInstances.id)]),
   ).limit(pageSize).offset((page-1)*pageSize);
 return {items,total,page,totalPages};
}
