import "server-only";

import {and,asc,count,desc,eq,ilike,isNull,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
  collegeMemberships,membershipRoles,projectMeetings,projectMembers,users,
} from "@/db/schema";
import {hasActiveMembership,hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";
import {resolveOptionalModuleAccess} from "@/modules/module-access/service";
import {requireProjectReadAccess} from "./access";
import {ProjectsServiceError} from "./errors";
import {escapeMentorMeetingSearch,mentorTeamMeetingsPage,mentorTeamMeetingsQuerySchema} from "./mentor-team-meetings-model";

/** Exact-project current team counts and historical registered meeting log. */
export async function getMentorTeamMeetings(context:RequestContext,raw:unknown){
  const query=mentorTeamMeetingsQuerySchema.parse(raw);
  const membership=context.membership;
  if(!membership||!hasActiveMembership(context)||!hasMembershipRole(context,"MENTOR")||
     !can(context,"projects.read",{
       collegeId:membership.collegeId,organizationId:membership.organizationId,
     }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  // An off module cannot disclose the existence, name, or status of
  // an otherwise scoped project or query its team membership.
  const projectsEnabled=(await resolveOptionalModuleAccess(context)).projects.enabled;
  if(!projectsEnabled)return {
    enabled:false as const,query,projectTitle:"",projectStatus:"",
    team:{learners:0,mentors:0,primaryRecorded:false},
    ...mentorTeamMeetingsPage(0,1),
    items:[] as {
      id:string;title:string;status:string;type:string;
      startsAt:Date;endsAt:Date;updatedAt:Date;timeZone:string;hasOutcome:boolean;
    }[],
  };
  const scope=await requireProjectReadAccess(context,query.projectId);
  if(scope.access!=="MENTOR"||scope.collegeId!==membership.collegeId||
     !can(context,"projects.read",{
       collegeId:scope.collegeId,organizationId:scope.organizationId,
     }))throw new ProjectsServiceError("PROJECT_ACCESS_DENIED");
  const db=getDb();
  const search=query.search?ilike(projectMeetings.title,
    "%"+escapeMentorMeetingSearch(query.search)+"%"):undefined;
  const meetingFilters=and(eq(projectMeetings.projectId,scope.project.id),
    query.status==="ALL"?undefined:eq(projectMeetings.status,query.status),
    query.type==="ALL"?undefined:eq(projectMeetings.meetingType,query.type),
    query.outcome==="ALL"?undefined:
      query.outcome==="RECORDED"
        ? sql`nullif(btrim(${projectMeetings.outcome}), '') is not null`
        : sql`nullif(btrim(${projectMeetings.outcome}), '') is null`,
    search);
  // Aggregate current, tenant-verified team members in SQL. Loading the
  // entire membership roster just to count learners/mentors is unbounded.
  const [teamSummary,summary]=await Promise.all([
    db.select({
      learners:sql<number>`count(*) filter(where ${projectMembers.role} = 'LEARNER')::int`.mapWith(Number),
      mentors:sql<number>`count(*) filter(where ${projectMembers.role} = 'MENTOR')::int`.mapWith(Number),
      primary:sql<boolean>`coalesce(bool_or(${projectMembers.role} = 'MENTOR' and ${projectMembers.isPrimary}),false)`,
    }).from(projectMembers)
      .innerJoin(collegeMemberships,eq(collegeMemberships.id,projectMembers.membershipId))
      .innerJoin(users,eq(users.id,collegeMemberships.userId))
      .innerJoin(membershipRoles,and(
        eq(membershipRoles.membershipId,collegeMemberships.id),
        sql`cast(${membershipRoles.role} as text) = ${projectMembers.role}`,
      ))
      .where(and(
        eq(projectMembers.projectId,scope.project.id),
        isNull(projectMembers.endedAt),
        eq(collegeMemberships.collegeId,scope.collegeId),
        eq(collegeMemberships.status,"ACTIVE"),
        eq(users.platformStatus,"ACTIVE"),
      )),
    db.select({total:count()}).from(projectMeetings).where(meetingFilters),
  ]);
  const page=mentorTeamMeetingsPage(Number(summary[0]?.total??0),query.page);
  const meetings=await db.select({
    id:projectMeetings.id,title:projectMeetings.title,
    status:projectMeetings.status,type:projectMeetings.meetingType,
    startsAt:projectMeetings.startsAt,endsAt:projectMeetings.endsAt,
    timeZone:projectMeetings.timeZone,outcome:projectMeetings.outcome,
    updatedAt:projectMeetings.updatedAt,
  }).from(projectMeetings)
    .where(meetingFilters)
    .orderBy(...(query.order==="OLDEST"
      ? [asc(projectMeetings.startsAt),asc(projectMeetings.id)]
      : [desc(projectMeetings.startsAt),desc(projectMeetings.id)]))
    .limit(page.pageSize).offset((page.page-1)*page.pageSize);
  return {
    enabled:true as const,query,projectTitle:scope.project.title,
    projectStatus:scope.project.status,
    team:{
      learners:Number(teamSummary[0]?.learners??0),
      mentors:Number(teamSummary[0]?.mentors??0),
      primaryRecorded:teamSummary[0]?.primary??false,
    },
    ...page,
    items:meetings.map(({outcome,...row})=>({
      ...row,hasOutcome:Boolean(outcome?.trim()),
    })),
  };
}
