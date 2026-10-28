import "server-only";
import {and,eq,sql} from "drizzle-orm";
import {colleges,courses,courseOfferings,courseSectionDeliveries,departments,sections} from "@/db/schema";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {z} from "zod";
import {getDb} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";

export const superAdminStudentProgressQuery=z.strictObject({
 offeringId:z.uuid(),
 // A class/section report is delivery-scoped rather than an offering-wide
 // union of the students in several unrelated classes.
 deliveryId:z.uuid().optional(),
 page:z.number().int().min(1).max(1000000).optional(),
 pageSize:z.number().int().min(1).max(500).optional(),
 sort:z.enum(["percent-asc","percent-desc"]).optional(),
});
export type StudentCourseProgressRow={
 membershipId:string;learnerId:string;studentName:string;rollNumber:string;videos:number;assignments:number;quizzes:number;
 totalVideos:number;totalAssignments:number;totalQuizzes:number;completed:number;percent:number;
};
export type StudentCourseProgressTotals={videos:number;assignments:number;quizzes:number};

/** SA-academics-people-67: authorized scoped roster and factual persisted completions,
 * not an aggregate offering content count mislabelled as student progress. */
export async function getSuperAdminStudentCourseProgress(context:RequestContext,raw:unknown){
 const {offeringId,deliveryId:requestedDeliveryId,page=1,pageSize=20,sort="percent-asc"}=
  superAdminStudentProgressQuery.parse(raw);
 const deliveryId=requestedDeliveryId??null;
 const offset=(page-1)*pageSize;
 if(!isSuperAdmin(context)||!context.adminScope?.collegeId)
  throw new AuthorizationError("courses.read");
 const collegeId=context.adminScope.collegeId;
 requirePermission(context,"courses.read",{
  collegeId,organizationId:context.adminScope.organizationId,
 });
 const found=await getDb().execute(sql`
  with selected as (
   select o.id,
    (${deliveryId}::uuid is null or exists (
     select 1 from course_teaching_assignments ta
     where ta.delivery_id=${deliveryId}::uuid
    )) as taught_in_class
   from course_offerings o
   join courses c on c.id=o.course_id
   join departments d on d.id=c.department_id
   where o.id=${offeringId}::uuid and d.college_id=${collegeId}::uuid
   and (${deliveryId}::uuid is null or exists (
    select 1 from course_section_deliveries cd
    join sections s on s.id=cd.section_id
     and s.cohort_id=o.cohort_id and s.academic_period_id=o.academic_period_id
    where cd.offering_id=o.id and cd.id=${deliveryId}::uuid
   ))
  )
  select count(*)::int as total,bool_and(taught_in_class) as "taughtInClass" from selected
 `);
 const validity=found.rows[0] as {total:number;taughtInClass:boolean|null}|undefined;
 const count=Number(validity?.total??0);
 if(count!==1)throw new AuthorizationError("courses.read");
 if(requestedDeliveryId&&validity?.taughtInClass!==true)
  throw new Error("COURSE_NOT_TAUGHT_IN_CLASS");
 const result=await getDb().execute(sql`
 with eligible_deliveries as (
  select distinct m.id as membership_id, d.id as delivery_id,
   coalesce(nullif(btrim(u.display_name),''),'Student #'||coalesce(m.legacy_membership_id::text,left(m.id::text,8))) as student_name
  from course_section_deliveries d
   join course_offerings o on o.id=d.offering_id
   join sections s on s.id=d.section_id
    and (${deliveryId}::uuid is not null or s.status='ACTIVE')
    and s.cohort_id=o.cohort_id and s.academic_period_id=o.academic_period_id
   join section_enrollments se on se.section_id=s.id
    and se.academic_period_id=o.academic_period_id
    and (se.status='ACTIVE' or
      (${deliveryId}::uuid is not null and se.status='COMPLETED'))
   join learner_program_enrollments e on e.id=se.learner_enrollment_id
    and e.cohort_id=o.cohort_id
    and (e.status='ACTIVE' or
      (${deliveryId}::uuid is not null and e.status='COMPLETED'))
   join college_memberships m on m.id=e.membership_id and m.status='ACTIVE'
   join membership_roles role on role.membership_id=m.id and role.role='LEARNER'
   join users u on u.id=m.user_id and u.platform_status='ACTIVE'
   where d.offering_id=${offeringId}::uuid
    -- An eligible section must have a persisted teaching association
    -- (ended assignments still count for authorized historical reports).
    and exists (select 1 from course_teaching_assignments ta
     where ta.delivery_id=d.id)
    and (${deliveryId}::uuid is not null or d.ended_at is null)
    and (${deliveryId}::uuid is null or d.id=${deliveryId}::uuid)
    and m.college_id=${collegeId}::uuid
 ), roster as (
  select distinct membership_id,student_name from eligible_deliveries
 ), published_items as (
  select lc.id,lc.content_type,lc.delivery_id from lesson_contents lc
  join course_lessons l on l.id=lc.lesson_id and l.status='ACTIVE'
   and l.visible_to_students=true and l.deleted_at is null
  join course_learning_paths p on p.id=l.learning_path_id
  where p.offering_id=${offeringId}::uuid and p.status='PUBLISHED'
   and lc.status='PUBLISHED' and lc.visible_to_students=true
   and lc.deleted_at is null and lc.deleted_with_lesson=false
   and lc.legacy_active is distinct from false
   and lc.content_type in ('VIDEO','YOUTUBE')
 ), published_assignments as (
  select a.id,a.delivery_id from course_assignments a
  join course_lessons l on l.id=a.lesson_id
  join course_learning_paths p on p.id=l.learning_path_id
  where p.offering_id=${offeringId}::uuid and p.status='PUBLISHED'
   and l.status='ACTIVE' and l.visible_to_students=true
   and l.deleted_at is null and a.status='PUBLISHED'
 ), published_quizzes as (
  select q.id,q.delivery_id from course_quizzes q
  join course_lessons l on l.id=q.lesson_id
  join course_learning_paths p on p.id=l.learning_path_id
  where p.offering_id=${offeringId}::uuid and p.status='PUBLISHED'
   and l.status='ACTIVE' and l.visible_to_students=true
   and l.deleted_at is null and q.status='PUBLISHED'
   and q.legacy_deleted_at is null
   and q.legacy_active is distinct from false
   and q.legacy_enabled is distinct from false
 )
 select progress.*,
  count(*) over()::int as "__totalRows",
  avg(case when ("totalVideos"+"totalAssignments"+"totalQuizzes")=0 then null
   else (videos+assignments+quizzes)*100.0/("totalVideos"+"totalAssignments"+"totalQuizzes")
  end) over()::float8 as "__meanPercent",
  sum(case when (videos+assignments+quizzes)=0 then 1 else 0 end)
   over()::int as "__notStartedCount"
 from (
 select r.membership_id as "membershipId",r.student_name as "studentName",
 (select lp.roll_number from learner_profiles lp where lp.membership_id=r.membership_id) as "rollNumber",
 (select count(distinct pr.lesson_content_id)::int
  from learner_content_progress pr
  join published_items pi on pi.id=pr.lesson_content_id
  where pr.membership_id=r.membership_id and pr.completed_at is not null
   and pr.legacy_was_deleted is distinct from true
   -- Check newer attempts irrespective of their deletion state.
   and not exists (
    select 1 from learner_content_progress newer
    where newer.membership_id=pr.membership_id
     and newer.lesson_content_id=pr.lesson_content_id
     and newer.attempt>pr.attempt
   )
   and (pi.delivery_id is null or exists (
    select 1 from eligible_deliveries ed
    where ed.membership_id=r.membership_id and ed.delivery_id=pi.delivery_id
   ))) as videos,
 (select count(distinct sub.assignment_id)::int from assignment_submissions sub
  join published_assignments pa on pa.id=sub.assignment_id
  where sub.membership_id=r.membership_id
   and sub.submitted_at is not null and sub.deleted_at is null
   and (pa.delivery_id is null or pa.delivery_id=sub.delivery_id)
   and exists (
    select 1 from eligible_deliveries ed
    where ed.membership_id=r.membership_id and ed.delivery_id=sub.delivery_id
   )) as assignments,
 (select count(distinct attempt.quiz_id)::int from quiz_attempts attempt
  join published_quizzes pq on pq.id=attempt.quiz_id
  where attempt.membership_id=r.membership_id
   and attempt.submitted_at is not null
   and attempt.deleted_at is null and attempt.legacy_deleted is distinct from true
   and (pq.delivery_id is null or pq.delivery_id=attempt.delivery_id)
   and exists (
    select 1 from eligible_deliveries ed
    where ed.membership_id=r.membership_id and ed.delivery_id=attempt.delivery_id
   )) as quizzes,
 (select count(*)::int from published_items pi where pi.delivery_id is null
   or exists (select 1 from eligible_deliveries ed
    where ed.membership_id=r.membership_id and ed.delivery_id=pi.delivery_id)) as "totalVideos",
 (select count(*)::int from published_assignments pa where pa.delivery_id is null
   or exists (select 1 from eligible_deliveries ed
    where ed.membership_id=r.membership_id and ed.delivery_id=pa.delivery_id)) as "totalAssignments",
 (select count(*)::int from published_quizzes pq where pq.delivery_id is null
   or exists (select 1 from eligible_deliveries ed
    where ed.membership_id=r.membership_id and ed.delivery_id=pq.delivery_id)) as "totalQuizzes"
 from roster r
 ) progress
 order by case when ("totalVideos"+"totalAssignments"+"totalQuizzes")=0 then 0
  else (videos+assignments+quizzes)*100.0/("totalVideos"+"totalAssignments"+"totalQuizzes") end
  ${sort==="percent-desc"?sql`desc`:sql`asc`},
  "studentName" asc,"membershipId" asc
 limit ${pageSize+1} offset ${offset}
 `);
 type DbRow={membershipId:string;studentName:string;rollNumber:string|null;videos:number;assignments:number;quizzes:number;
  totalVideos:number;totalAssignments:number;totalQuizzes:number;
  __totalRows:number;__meanPercent:number|null;__notStartedCount:number};
 const received=result.rows as unknown as DbRow[];
 const first=received[0];
 const rows=received.slice(0,pageSize).map(row=>({
  membershipId:row.membershipId,learnerId:row.membershipId,
  studentName:row.studentName||"Student #"+row.membershipId.slice(0,8),
  rollNumber:row.rollNumber?.trim()||"—",
  videos:Number(row.videos),assignments:Number(row.assignments),quizzes:Number(row.quizzes),
  totalVideos:Number(row.totalVideos),totalAssignments:Number(row.totalAssignments),
  totalQuizzes:Number(row.totalQuizzes),
  completed:Number(row.videos)+Number(row.assignments)+Number(row.quizzes),
  percent:(Number(row.totalVideos)+Number(row.totalAssignments)+Number(row.totalQuizzes))>0?
   Math.round(100*(Number(row.videos)+Number(row.assignments)+Number(row.quizzes))/
    (Number(row.totalVideos)+Number(row.totalAssignments)+Number(row.totalQuizzes))):0,
 }));
 // Student names and progress may be private. A stale request snapshot
 // must not disclose them if a Super Admin role is revoked while SQL runs.
 await getDb().transaction(async tx=>{
  const [college]=await tx.select({status:colleges.status,organizationId:colleges.organizationId})
   .from(colleges).where(eq(colleges.id,collegeId)).for("share").limit(1);
  if(!college||college.status!=="ACTIVE")throw new AuthorizationError("courses.read");
  const live=await assertPersistedPlatformPermission(tx,context,"courses.read",{
   collegeId,organizationId:college.organizationId,
  });
  if(!isSuperAdmin(live))throw new AuthorizationError("courses.read");
 });
 // An explicit offset/cursor never changes college, offering or section scope.
 // Callers can iterate pages of 20/50/100 without exposing other deliveries.
 return {
  offeringId,deliveryId,collegeId,rows,page,pageSize,
  totalRows:first?Number(first.__totalRows):0,
  meanPercent:first?.__meanPercent==null?null:Number(first.__meanPercent),
  notStartedCount:first?Number(first.__notStartedCount):0,
  hasMore:received.length>pageSize,
  truncated:received.length>pageSize || page>1,
 };
}

/** Resolves a bookmarked legacy course/class report to vNext UUID scope.
 * IDs are NEVER global lookup keys: both course and section must belong to
 * the persisted acting college. When no class is given, multiple eligible
 * offerings are ambiguous and the caller must ask for a term/section.
 */
export async function resolveLegacyCourseProgressScope(
 context:RequestContext,raw:{courseId:string|number;classId?:string|number|null},
){
 if(!isSuperAdmin(context)||!context.adminScope?.collegeId)
  throw new AuthorizationError("courses.read");
 const collegeId=context.adminScope.collegeId;
 requirePermission(context,"courses.read",{collegeId,
  organizationId:context.adminScope.organizationId});
 const id=z.union([z.uuid(),z.coerce.number().int().positive()]);
 const courseId=id.parse(raw.courseId);
 const classId=raw.classId==null?null:id.parse(raw.classId);
 // A legacy class-specific bookmark may refer to a completed term whose
 // offering has since been archived. Do not drop that historic assignment;
 // without a class, only live offerings can be inferred unambiguously.
 const filter=and(eq(departments.collegeId,collegeId),
  typeof courseId==="number"?eq(courses.legacyCourseId,courseId):eq(courses.id,courseId),
  classId===null?eq(courseOfferings.status,"ACTIVE"):undefined);
 if(classId===null){
  const matches=await getDb().selectDistinct({offeringId:courseOfferings.id})
   .from(courseOfferings)
   .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
   .innerJoin(departments,eq(departments.id,courses.departmentId))
   .where(filter).limit(2);
  return matches.length===1?{offeringId:matches[0]!.offeringId,deliveryId:null}:null;
 }
 const matches=await getDb().selectDistinct({
  offeringId:courseOfferings.id,deliveryId:courseSectionDeliveries.id,
 }).from(courseOfferings)
 .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
 .innerJoin(departments,eq(departments.id,courses.departmentId))
 .innerJoin(courseSectionDeliveries,
  eq(courseSectionDeliveries.offeringId,courseOfferings.id))
 .innerJoin(sections,eq(sections.id,courseSectionDeliveries.sectionId))
 .where(and(filter,typeof classId==="number"
  ?eq(sections.legacyClassId,classId):eq(sections.id,classId),
  // Class and course must have been taught together, not merely offered in
  // the same semester. Ended associations are valid for historical reporting.
  sql`exists (select 1 from course_teaching_assignments ta
    where ta.delivery_id = ${courseSectionDeliveries.id})`))
 .limit(2);
 return matches.length===1?matches[0]!:null;
}
