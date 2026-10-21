import "server-only";
import {eq,sql} from "drizzle-orm";
import {colleges} from "@/db/schema";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {z} from "zod";
import {getDb} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";

export const superAdminStudentProgressQuery=z.strictObject({offeringId:z.uuid()});
export type StudentCourseProgressRow={
 membershipId:string;studentName:string;rollNumber:string|null;videos:number;assignments:number;quizzes:number;
 totalVideos:number;totalAssignments:number;totalQuizzes:number;
};
export type StudentCourseProgressTotals={videos:number;assignments:number;quizzes:number};

/** SA-academics-people-67: authorized scoped roster and factual persisted completions,
 * not an aggregate offering content count mislabelled as student progress. */
export async function getSuperAdminStudentCourseProgress(context:RequestContext,raw:unknown){
 const {offeringId}=superAdminStudentProgressQuery.parse(raw);
 if(!isSuperAdmin(context)||!context.adminScope?.collegeId)
  throw new AuthorizationError("courses.read");
 const collegeId=context.adminScope.collegeId;
 requirePermission(context,"courses.read",{
  collegeId,organizationId:context.adminScope.organizationId,
 });
 const found=await getDb().execute(sql`
  with selected as (
   select o.id from course_offerings o
   join courses c on c.id=o.course_id
   join departments d on d.id=c.department_id
   where o.id=${offeringId}::uuid and d.college_id=${collegeId}::uuid
  )
  select count(*)::int as total from selected
 `);
 const count=Number((found.rows[0] as {total:number}|undefined)?.total??0);
 if(count!==1)throw new AuthorizationError("courses.read");
 const result=await getDb().execute(sql`
 with eligible_deliveries as (
  select distinct m.id as membership_id, d.id as delivery_id,
   coalesce(nullif(btrim(u.display_name),''),'Student') as student_name
  from course_section_deliveries d
   join course_offerings o on o.id=d.offering_id
   join sections s on s.id=d.section_id and s.status='ACTIVE'
    and s.cohort_id=o.cohort_id and s.academic_period_id=o.academic_period_id
   join section_enrollments se on se.section_id=s.id
    and se.academic_period_id=o.academic_period_id and se.status='ACTIVE'
   join learner_program_enrollments e on e.id=se.learner_enrollment_id
    and e.cohort_id=o.cohort_id and e.status='ACTIVE'
   join college_memberships m on m.id=e.membership_id and m.status='ACTIVE'
   join membership_roles role on role.membership_id=m.id and role.role='LEARNER'
   join users u on u.id=m.user_id and u.platform_status='ACTIVE'
   where d.offering_id=${offeringId}::uuid and d.ended_at is null
    and m.college_id=${collegeId}::uuid
 ), roster as (
  select distinct membership_id,student_name from eligible_deliveries
 ), published_items as (
  select lc.id,lc.content_type,lc.delivery_id from lesson_contents lc
  join course_lessons l on l.id=lc.lesson_id and l.status='ACTIVE'
  join course_learning_paths p on p.id=l.learning_path_id
  where p.offering_id=${offeringId}::uuid and p.status='PUBLISHED'
   and lc.status='PUBLISHED' and lc.visible_to_students=true
   and lc.content_type in ('VIDEO','YOUTUBE')
 ), published_assignments as (
  select a.id,a.delivery_id from course_assignments a
  join course_lessons l on l.id=a.lesson_id
  join course_learning_paths p on p.id=l.learning_path_id
  where p.offering_id=${offeringId}::uuid and p.status='PUBLISHED'
   and l.status='ACTIVE' and a.status='PUBLISHED'
 ), published_quizzes as (
  select q.id,q.delivery_id from course_quizzes q
  join course_lessons l on l.id=q.lesson_id
  join course_learning_paths p on p.id=l.learning_path_id
  where p.offering_id=${offeringId}::uuid and p.status='PUBLISHED'
   and l.status='ACTIVE' and q.status in ('PUBLISHED','CLOSED')
 )
 select * from (
 select r.membership_id as "membershipId",r.student_name as "studentName",
 (select lp.roll_number from learner_profiles lp where lp.membership_id=r.membership_id) as "rollNumber",
 (select count(distinct pr.lesson_content_id)::int
  from learner_content_progress pr
  join published_items pi on pi.id=pr.lesson_content_id
  where pr.membership_id=r.membership_id and pr.completed_at is not null
   and (pi.delivery_id is null or exists (
    select 1 from eligible_deliveries ed
    where ed.membership_id=r.membership_id and ed.delivery_id=pi.delivery_id
   ))) as videos,
 (select count(distinct sub.assignment_id)::int from assignment_submissions sub
  join published_assignments pa on pa.id=sub.assignment_id
  where sub.membership_id=r.membership_id
   and (pa.delivery_id is null or pa.delivery_id=sub.delivery_id)
   and exists (
    select 1 from eligible_deliveries ed
    where ed.membership_id=r.membership_id and ed.delivery_id=sub.delivery_id
   )) as assignments,
 (select count(distinct attempt.quiz_id)::int from quiz_attempts attempt
  join published_quizzes pq on pq.id=attempt.quiz_id
  where attempt.membership_id=r.membership_id
   and attempt.submitted_at is not null
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
  else (videos+assignments+quizzes)*100.0/("totalVideos"+"totalAssignments"+"totalQuizzes") end asc,
  "studentName" asc,"membershipId" asc
 limit 501
 `);
 type DbRow={membershipId:string;studentName:string;rollNumber:string|null;videos:number;assignments:number;quizzes:number;
  totalVideos:number;totalAssignments:number;totalQuizzes:number};
 const rows=(result.rows as unknown as DbRow[]).slice(0,500).map(row=>({
  membershipId:row.membershipId,studentName:row.studentName,rollNumber:row.rollNumber,
  videos:Number(row.videos),assignments:Number(row.assignments),quizzes:Number(row.quizzes),
  totalVideos:Number(row.totalVideos),totalAssignments:Number(row.totalAssignments),
  totalQuizzes:Number(row.totalQuizzes),
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
 return {offeringId,collegeId,rows,truncated:result.rows.length>500};
}
