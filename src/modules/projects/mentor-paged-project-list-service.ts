import "server-only";
import {and,asc,desc,eq,ilike,isNull,ne,or,not,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,membershipRoles,projectInstances,projectMembers,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {mentorProjectListQuerySchema,type MentorProjectListQuery} from "./mentor-project-list-query";
import {containsLikePattern} from "@/lib/sql-match";
import {ProjectsServiceError} from "./errors";
import {can} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";

/** SQL crosswalk for legacy /api/v1/projects/me/page.
 * Legacy page is zero-based; mentorProjectListQuerySchema normalizes page1,
 * legacyPage and ?page=N to one-based SQL offsets. Max page size stays 50.
 * PLANNED/ACTIVE/COMPLETED/ARCHIVED are relational project statuses;
 * CURRENT excludes ARCHIVED; IN_PROGRESS/READY/BLOCKED are derived from
 * tasks/blockers and attention. Advanced sorts/counts remain DB-side, not
 * an unbounded project list in application memory.
 */
export async function listPagedMentorProjects(context:RequestContext,query:MentorProjectListQuery){
 // The caller passes the schema's *normalized* one-based page. Validate at
 // this boundary without reinterpreting it as a legacy zero-based ?page=N;
 // parsing the already-normalized page directly would silently skip page 1.
 query=mentorProjectListQuerySchema.parse({...query,page1:query.page});
 const membership=context.membership;
 if(!membership || membership.status!=="ACTIVE" ||
   !membership.roles.includes("MENTOR")||context.user.platformStatus!=="ACTIVE"||
   !can(context,"projects.read",{
     collegeId:membership.collegeId,organizationId:membership.organizationId,
   }))
   throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
 if(!(await resolveOptionalModuleAccess(context)).projects.enabled)
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
   // Resolve names only through ACTIVE same-college mentor memberships.
   // The EXISTS predicate runs before count/pagination, so searching by a
   // colleague's name never returns a cross-tenant project or a fake total.
   const mentorName=sql<boolean>`exists (
     select 1 from project_members pm_name
     join college_memberships cm_name on cm_name.id=pm_name.membership_id
     join users u_name on u_name.id=cm_name.user_id
     where pm_name.project_id=${projectInstances.id}
       and cm_name.college_id=${membership.collegeId}
       and cm_name.status='ACTIVE' and u_name.platform_status='ACTIVE'
       and pm_name.ended_at is null and pm_name.deleted_at is null
       and pm_name.role='MENTOR'
       and u_name.display_name ilike ${term}
   )`;
   conditions.push(or(ilike(projectInstances.title,term),
     ilike(projectInstances.slug,term),
     ilike(projectInstances.courseLabel,term),
     ilike(projectInstances.summary,term),mentorName)!);
 }
 if(query.assignment==="PRIMARY") conditions.push(eq(projectMembers.isPrimary,true));
 if(query.assignment==="SUPPORTING") conditions.push(eq(projectMembers.isPrimary,false));
 if(query.status==="CURRENT") conditions.push(ne(projectInstances.status,"ARCHIVED"));
 else if(query.status && ["PLANNED","ACTIVE","COMPLETED","ARCHIVED"].includes(query.status))
   conditions.push(eq(projectInstances.status,query.status as "PLANNED"|"ACTIVE"|"COMPLETED"|"ARCHIVED"));
 // These correlated aggregates run only against tenant/mentor-scoped projects.
 // They preserve the legacy 0/positive task semantics without loading every
 // workspace and then slicing it in the application process.
 const totalTasks=sql<number>`(select count(*)::int from project_tasks pt
   where pt.project_id=${projectInstances.id})`;
 const openTasks=sql<number>`(select count(*)::int from project_tasks pt
   where pt.project_id=${projectInstances.id} and pt.status <> 'DONE')`;
 const teamSize=sql<number>`(select count(*)::int from project_members pm
   join college_memberships cm on cm.id=pm.membership_id
   join users u on u.id=cm.user_id
   join membership_roles mr on mr.membership_id=cm.id
     and cast(mr.role as text)=pm.role
   where pm.project_id=${projectInstances.id} and pm.ended_at is null
     and cm.college_id=${membership.collegeId}
     and cm.status='ACTIVE' and u.platform_status='ACTIVE')`;
 const workDone=sql`${totalTasks} > 0 and ${openTasks} = 0`;
 const hasReview=sql`exists(select 1 from project_submissions ps
   left join project_submission_reviews sr on sr.submission_id=ps.id
   where ps.project_id=${projectInstances.id}
     and ps.id=(select ps2.id from project_submissions ps2
       where ps2.project_id=ps.project_id
       order by ps2.version desc limit 1)
     and ps.status in ('SUBMITTED','UNDER_REVIEW','IN_REVIEW')
     and ps.submitted_at is not null and ps.reopened_at is null
     and (sr.reviewed_at is null or ps.submitted_at > sr.reviewed_at))`;
 const requested=sql`exists(select 1 from project_meetings m
   where m.project_id=${projectInstances.id} and m.status='REQUESTED')`;
 const now=new Date();
 const soon=sql`exists(select 1 from project_meetings m
   where m.project_id=${projectInstances.id}
     and m.status in ('SCHEDULED','RESCHEDULED')
     and m.starts_at between ${now} and ${new Date(now.getTime()+48*3600_000)})`;
 const lastActivity=sql`coalesce(greatest(
   (select max(a.occurred_at) from activity_events a
     where a.module='PROJECTS' and a.college_id=${membership.collegeId}
       and a.organization_id=${membership.organizationId}
       and split_part(a.group_key,':',1)='project'
       and split_part(a.group_key,':',2)=${projectInstances.id}::text),
   (select max(s.updated_at) from project_submissions s
     where s.project_id=${projectInstances.id}),
   (select max(m.updated_at) from project_meetings m
     where m.project_id=${projectInstances.id}),
   (select max(ts.updated_at) from project_task_submissions ts
     where ts.project_id=${projectInstances.id})
 ),${projectInstances.updatedAt})`;
 const stalled=sql`${projectInstances.status} in ('PLANNED','ACTIVE')
   and trim(coalesce(${projectInstances.blocker},''))=''
   and ${lastActivity} <= ${new Date(now.getTime()-7*86400000)}`;
 const blocked=sql`(trim(coalesce(${projectInstances.blocker},'')) <> '' or (${stalled}))`;
 const attention=sql`(${projectInstances.status} <> 'ARCHIVED'
   and (${hasReview} or ${requested} or ${stalled} or ${soon}))`;
 if(query.status==="IN_PROGRESS")conditions.push(and(
   eq(projectInstances.status,"ACTIVE"),sql`${openTasks} > 0`)!);
 if(query.status==="READY")conditions.push(or(
   eq(projectInstances.status,"COMPLETED"),workDone)!);
 if(query.status==="BLOCKED")conditions.push(blocked);
 if(query.work==="NO_TASKS")conditions.push(sql`${totalTasks}=0`);
 if(query.work==="HAS_OPEN_TASKS")conditions.push(sql`${openTasks}>0`);
 if(query.work==="ALL_DONE")conditions.push(workDone);
 if(query.work==="HAS_DONE_TASKS")conditions.push(sql`${totalTasks}>${openTasks}`);
 if(query.attention==="BLOCKED")conditions.push(blocked);
 if(query.attention==="MENTOR_REVIEW")conditions.push(and(ne(projectInstances.status,"ARCHIVED"),hasReview)!);
 if(query.attention==="MENTOR_REQUESTED")conditions.push(and(ne(projectInstances.status,"ARCHIVED"),requested)!);
 if(query.attention==="MENTOR_STALLED")conditions.push(stalled);
 if(query.attention==="MENTOR_MEETING_SOON")conditions.push(and(ne(projectInstances.status,"ARCHIVED"),soon)!);
 if(query.attention==="MENTOR_ANY_ATTENTION")conditions.push(attention);
 if(query.attention==="MENTOR_NO_ATTENTION")conditions.push(not(attention));
 const progress=sql<number|null>`case when ${totalTasks}>0
   then (100.0*(${totalTasks}-${openTasks})/${totalTasks})
   when ${projectInstances.progressPercent}>0 and ${projectInstances.progressPercent}<=100
   then ${projectInstances.progressPercent}::numeric else null end`;
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
 const advancedOrder=query.sort==="OPEN_TASKS"
   ?[desc(openTasks),desc(projectInstances.updatedAt),naturalTitle,asc(projectInstances.id)]
   :query.sort==="TEAM_SIZE_DESC"
   ?[desc(teamSize),desc(projectInstances.updatedAt),naturalTitle,asc(projectInstances.id)]
   :query.sort==="TEAM_SIZE_ASC"
   ?[asc(teamSize),desc(projectInstances.updatedAt),naturalTitle,asc(projectInstances.id)]
   :query.sort==="PROGRESS"
   ?[sql`${progress} asc nulls last`,desc(projectInstances.updatedAt),naturalTitle,asc(projectInstances.id)]
   :query.sort==="PROGRESS_DESC"
   ?[sql`${progress} desc nulls last`,desc(projectInstances.updatedAt),naturalTitle,asc(projectInstances.id)]
   :null;
 const items=await getDb().select({
   memberId:projectMembers.id,memberRole:projectMembers.role,
   memberRoleKind:projectMembers.roleKind,
   memberCanMutate:projectMembers.canMutate,
   isPrimaryMentor:projectMembers.isPrimary,project:projectInstances,
 }).from(projectMembers)
   .innerJoin(projectInstances,eq(projectInstances.id,projectMembers.projectId))
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
   .innerJoin(users,eq(users.id,collegeMemberships.userId))
   .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
   .where(and(...conditions))
   .orderBy(
      sql`case when ${projectInstances.status} = 'ARCHIVED' then 1 else 0 end`,
      ...(advancedOrder??(query.sort==="TITLE"?
        [naturalTitle,asc(projectInstances.id)]:
        [desc(projectInstances.updatedAt),naturalTitle,asc(projectInstances.id)])),
   ).limit(pageSize).offset((page-1)*pageSize);
 return {items,total,page,totalPages};
}
