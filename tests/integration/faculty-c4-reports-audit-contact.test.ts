import {deleteDisposableAttendanceEvents} from "../support/db045-attendance-fixture.mjs";
import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {createProgram} from "@/modules/academics/program-service";
import {createAcademicPeriod} from "@/modules/academics/period-service";
import {createCohort} from "@/modules/academics/cohort-service";
import {createSection} from "@/modules/academics/section-service";
import {createLearnerProgramEnrollment} from "@/modules/academics/enrollment-service";
import {assignLearnerToSection} from "@/modules/academics/roster-service";
import {createCourse} from "@/modules/courses/course-service";
import {createCourseOffering} from "@/modules/courses/offering-service";
import {createCourseSectionDelivery} from "@/modules/courses/delivery-service";
import {createCourseTeachingAssignment} from "@/modules/courses/teaching-assignment-service";
import {createCourseDiscussionMessage,toggleCourseDiscussionPin,deleteCourseDiscussionMessage} from "@/modules/courses/discussion-service";
import {getFacultyDiscussionHistory} from "@/modules/courses/faculty-discussion-history-service";
import {getFacultyReportsHub} from "@/modules/courses/faculty-reports-hub-service";
import {getFacultyCourseWorkspace} from "@/modules/courses/faculty-course-service";
import {getFacultyCourseHomeSignals} from "@/modules/courses/faculty-course-home-service";
import {getFacultyDeliveryRoster,createFacultyAttendanceSession,markFacultyAttendance,getFacultyAttendanceWorkspace} from "@/modules/attendance/faculty-service";
import {getFacultyStudentDetail} from "@/modules/courses/faculty-student-detail-service";
import {getOwnFacultyContactAvailability} from "@/modules/people/faculty-contact-availability-service";
import {SEED_IDS} from "../../scripts/db-seed-data";

if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const admin:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const faculty:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"seed-faculty",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["FACULTY"]},
};
const learner:RequestContext={
 user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,
 organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
};
type Fixture={programId:string;periodId:string;cohortId:string;sectionId:string;
 courseId:string;offeringId:string;deliveryId:string;enrollmentId:string;
 learnerUserId:string;learnerMembershipId:string;
 attendanceFacultyUserId?:string;attendanceFacultyMembershipId?:string};
let active:Fixture|null=null;

async function cleanup(){
 const f=active;
 if(!f)return;
 // Only mutable fixture entities are removed. NEVER delete append-only activity_events.
 await pool.query("delete from course_discussion_messages where delivery_id=$1",[f.deliveryId]);
 // Dispose only mutable Section attendance rows. Keep activity_events forever:
 // their subject references are text identifiers, their actors are retained.
 const attendanceEventIds=await pool.query<{schedule_event_id:string}>(
  "select schedule_event_id from section_schedule_event_courses where delivery_id=$1",[f.deliveryId]);
 await deleteDisposableAttendanceEvents(pool,attendanceEventIds.rows.map(r=>r.schedule_event_id));
 await pool.query("delete from attendance_records where schedule_event_id in (select schedule_event_id from section_schedule_event_courses where delivery_id=$1)",[f.deliveryId]);
 await pool.query("delete from attendance_sessions where schedule_event_id in (select schedule_event_id from section_schedule_event_courses where delivery_id=$1)",[f.deliveryId]);
 await pool.query("delete from section_schedule_event_courses where delivery_id=$1",[f.deliveryId]);
 await pool.query("delete from section_schedule_events where section_id=$1",[f.sectionId]);
 await pool.query("delete from course_teaching_assignments where delivery_id=$1",[f.deliveryId]);
 await pool.query("delete from course_section_deliveries where id=$1",[f.deliveryId]);
 await pool.query("delete from course_offerings where id=$1",[f.offeringId]);
 // Creating an academic CORE offering may persist the curriculum link.
 // Remove only this fixture course's link AFTER its offering; otherwise the
 // protected FK rejects deleting the course and prevents later cleanup.
 await pool.query("delete from program_term_courses where course_id=$1",[f.courseId]);
 await pool.query("delete from courses where id=$1",[f.courseId]);
 await pool.query("delete from section_enrollments where learner_enrollment_id=$1",[f.enrollmentId]);
 await pool.query("delete from learner_program_enrollments where id=$1",[f.enrollmentId]);
 await pool.query("delete from sections where id=$1",[f.sectionId]);
 await pool.query("delete from cohorts where id=$1",[f.cohortId]);
 // Program creation materializes canonical term definitions. Remove only
 // this disposable fixture's unused terms after its cohort, offerings and
 // curriculum links are gone; DB02 forbids deleting referenced live terms.
 await pool.query("delete from program_terms where program_id=$1",[f.programId]);
 await pool.query("delete from programs where id=$1",[f.programId]);
 await pool.query("delete from academic_periods where id=$1",[f.periodId]);
 // Preserve append-only actor identity references if any writer added one.
 const audit=await pool.query(
  "select 1 from activity_events where actor_user_id=$1::uuid or actor_membership_id=$2::uuid limit 1",
  [f.learnerUserId,f.learnerMembershipId],
 );
 // Notification receipts are durable FK references, just like the audit log.
 // Do not delete a fixture principal while any delivered notice refers to it.
 const notices=await pool.query(
  "select 1 from in_app_notifications where user_id=$1::uuid limit 1",
  [f.learnerUserId],
 );
 if(!audit.rowCount&&!notices.rowCount){
  await pool.query("delete from membership_roles where membership_id=$1",[f.learnerMembershipId]);
  await pool.query("delete from college_memberships where id=$1",[f.learnerMembershipId]);
  // Recipient inbox rows for this fixture-only learner block the user delete.
  await pool.query("delete from in_app_notifications where user_id=$1",[f.learnerUserId]);
  await pool.query("delete from users where id=$1",[f.learnerUserId]);
 }
 // The attendance-specific teacher becomes an append-only audit actor. Retain
 // that principal when referenced; otherwise remove only our test membership.
 if(f.attendanceFacultyUserId&&f.attendanceFacultyMembershipId){
  const teacherAudit=await pool.query(
   "select 1 from activity_events where actor_user_id=$1::uuid or actor_membership_id=$2::uuid limit 1",
   [f.attendanceFacultyUserId,f.attendanceFacultyMembershipId],
  );
  const teacherNotices=await pool.query(
   "select 1 from in_app_notifications where user_id=$1::uuid limit 1",
   [f.attendanceFacultyUserId],
  );
  if(!teacherAudit.rowCount&&!teacherNotices.rowCount){
   await pool.query("delete from membership_roles where membership_id=$1",[f.attendanceFacultyMembershipId]);
   await pool.query("delete from college_memberships where id=$1",[f.attendanceFacultyMembershipId]);
   await pool.query("delete from users where id=$1",[f.attendanceFacultyUserId]);
  }
 }
 active=null;
}
async function fixture(){
 const suffix=randomUUID().slice(0,8).toUpperCase();
 const program=await createProgram(admin,{departmentId:SEED_IDS.departmentA,
  name:"Chat4 Report "+suffix,code:"C4RH-"+suffix+"-P",durationTerms:8});
 const period=await createAcademicPeriod(admin,{collegeId:SEED_IDS.collegeA,
  name:"Chat4 Report Period "+suffix,code:"C4RH-"+suffix+"-T",
  startDate:"2026-07-01",endDate:"2027-12-31"});
 const cohort=await createCohort(admin,{programId:program.id,
  name:"Chat4 Report Intake "+suffix,code:"C4RH-"+suffix+"-C",startPeriodId:period.id});
 // Cohort INSERT owns its canonical progression row: no separate insert
 // with an actor is permitted by the registered DB02 lifecycle guard.
 const progression=await pool.query<{current_term_number:number;current_period_id:string}>(
  "select current_term_number,current_period_id from cohort_progression_state where cohort_id=$1",
  [cohort.id],
 );
 expect(progression.rows).toEqual([{current_term_number:1,current_period_id:period.id}]);
 const section=await createSection(admin,{cohortId:cohort.id,academicPeriodId:period.id,
  name:"Chat4 Section "+suffix,code:"C4RH-"+suffix+"-S"});
 const course=await createCourse(admin,{departmentId:SEED_IDS.departmentA,
  name:"Chat4 Report Course "+suffix,code:"C4RH-"+suffix+"-R"});
 const offering=await createCourseOffering(admin,{courseId:course.id,
  cohortId:cohort.id,academicPeriodId:period.id,type:"CORE",credits:4,displayOrder:0});
 const delivery=await createCourseSectionDelivery(admin,{offeringId:offering.id,sectionId:section.id});
 await createCourseTeachingAssignment(admin,{deliveryId:delivery.id,
  membershipId:SEED_IDS.facultyCollegeAMembership,role:"PRIMARY"});
 // The seeded learner can have an active program in another test/fixture.
 // Use an isolated learner so this test proves the intended Section outcome
 // instead of failing on learner_program_enrollments_active_membership_uq.
 const learnerUserId=randomUUID();
 const learnerMembershipId=randomUUID();
 await pool.query(
  "insert into users (id,identity_uid,email,display_name,platform_status) values ($1::uuid,$2::text,$3::text,$4::text,'ACTIVE')",
  [learnerUserId,"faculty-c4-roster-"+learnerUserId,
   "faculty-c4-roster-"+learnerUserId+"@example.invalid","Faculty C4 Roster Learner"],
 );
 await pool.query(
  "insert into college_memberships (id,user_id,college_id,status) values ($1::uuid,$2::uuid,$3::uuid,'ACTIVE')",
  [learnerMembershipId,learnerUserId,SEED_IDS.collegeA],
 );
 await pool.query(
  "insert into membership_roles (id,membership_id,role) values ($1::uuid,$2::uuid,'LEARNER')",
  [randomUUID(),learnerMembershipId],
 );
 const enrollment=await createLearnerProgramEnrollment(admin,{
  membershipId:learnerMembershipId,programId:program.id,cohortId:cohort.id});
 await assignLearnerToSection(admin,{learnerEnrollmentId:enrollment.id,sectionId:section.id});
 active={programId:program.id,periodId:period.id,cohortId:cohort.id,sectionId:section.id,
  courseId:course.id,offeringId:offering.id,deliveryId:delivery.id,enrollmentId:enrollment.id,
  learnerUserId,learnerMembershipId};
 return active;
}
afterEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});
describe("Faculty registered report/history positive and scope denials",()=>{
 it("reads exact Section moderation history with real persisted pin/deletion audit",async()=>{
  const f=await fixture();
  const msg=await createCourseDiscussionMessage(faculty,f.deliveryId,{messageText:"Fixture moderation event"});
  await toggleCourseDiscussionPin(faculty,msg.id,f.deliveryId);
  await deleteCourseDiscussionMessage(faculty,msg.id,f.deliveryId);
  const history=await getFacultyDiscussionHistory(faculty,{deliveryId:f.deliveryId});
  expect(history.total).toBe(2);
  expect(history.items.map(row=>row.action)).toEqual([
   "Discussion deletion recorded","Pinned by moderator",
  ]);
  await expect(getFacultyDiscussionHistory(learner,{deliveryId:f.deliveryId})).rejects.toBeDefined();
  await expect(getFacultyDiscussionHistory(faculty,{deliveryId:SEED_IDS.collegeB})).rejects.toBeDefined();
  await expect(getFacultyDiscussionHistory(faculty,{deliveryId:f.deliveryId,collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
 });
 it("loads a real current teaching Section Overview with accurate no-mark/no-assessment signals",async()=>{
  const f=await fixture();
  const workspace=await getFacultyCourseWorkspace(faculty,f.deliveryId);
  expect(workspace.course.deliveryId).toBe(f.deliveryId);
  expect(workspace.course.sectionId).toBe(f.sectionId);
  expect(workspace.course.courseName).toContain("Chat4 Report Course");
  expect(workspace.summary).toMatchObject({
   lessons:0,contents:0,assignments:0,quizzes:0,
   draftItems:0,publishedItems:0,
  });
  const signals=await getFacultyCourseHomeSignals(faculty,workspace);
  expect(signals.attendance.markedSessions).toBe(0);
  expect(signals.attendance.averagePercent).toBeNull();
  expect(signals.pendingSubmissions).toEqual([]);
  expect(signals.atRiskTotal).toBe(0);
  expect(signals.performance.averagePercent).toBeNull();
  await expect(getFacultyCourseWorkspace(learner,f.deliveryId)).rejects.toBeDefined();
  await expect(getFacultyCourseWorkspace(faculty,SEED_IDS.collegeB)).rejects.toBeDefined();
  await expect(getFacultyCourseWorkspace({...faculty,user:{...faculty.user,platformStatus:"DISABLED"}},f.deliveryId)).rejects.toBeDefined();
  await expect(getFacultyCourseWorkspace({...faculty,membership:{...faculty.membership!,collegeId:SEED_IDS.collegeB}},f.deliveryId)).rejects.toBeDefined();
 });
 it("reports persisted current Section roster and unknown attendance without invented scores",async()=>{
  const f=await fixture();
  const report=await getFacultyReportsHub(faculty,{deliveryId:f.deliveryId});
  expect(report.rosterSize).toBe(1);
  expect(report.breakdown).toEqual({
   assignments:0,quizzes:0,publishedAssignments:0,publishedQuizzes:0,
  });
  expect(report.attendance).toEqual({scheduled:0,marked:0});
  expect(report.health.items).toEqual([]);
  await expect(getFacultyReportsHub(learner,{deliveryId:f.deliveryId})).rejects.toBeDefined();
  await expect(getFacultyReportsHub(faculty,{deliveryId:SEED_IDS.collegeB})).rejects.toBeDefined();
  const disabled:RequestContext={...faculty,user:{...faculty.user,platformStatus:"DISABLED"}};
  await expect(getFacultyReportsHub(disabled,{deliveryId:f.deliveryId})).rejects.toBeDefined();
 });

 it("reads exactly one enrolled Section learner and denies out-of-roster, stale and foreign scopes",async()=>{
  const f=await fixture();
  const {roster,delivery}=await getFacultyDeliveryRoster(faculty,f.deliveryId);
  expect(delivery.deliveryId).toBe(f.deliveryId);
  expect(roster.map(row=>row.membershipId)).toEqual([f.learnerMembershipId]);
  const detail=await getFacultyStudentDetail(faculty,{
   deliveryId:f.deliveryId,membershipId:f.learnerMembershipId,
  });
  expect(detail.course.deliveryId).toBe(f.deliveryId);
  expect(detail.student.membershipId).toBe(f.learnerMembershipId);
  expect(detail.student.displayName).toBe("Faculty C4 Roster Learner");
  expect(detail.summary).toMatchObject({
   present:0,absent:0,unmarked:0,upcoming:0,recorded:0,percent:null,
  });
  expect(detail.sessions).toEqual([]);
  await expect(getFacultyStudentDetail(faculty,{
   deliveryId:f.deliveryId,membershipId:SEED_IDS.learnerCollegeAMembership,
  })).rejects.toBeDefined();
  await expect(getFacultyStudentDetail(faculty,{
   deliveryId:SEED_IDS.collegeB,membershipId:f.learnerMembershipId,
  })).rejects.toBeDefined();
  await expect(getFacultyStudentDetail(learner,{
   deliveryId:f.deliveryId,membershipId:f.learnerMembershipId,
  })).rejects.toBeDefined();
  const disabled={...faculty,user:{...faculty.user,platformStatus:"DISABLED" as const}};
  await expect(getFacultyStudentDetail(disabled,{
   deliveryId:f.deliveryId,membershipId:f.learnerMembershipId,
  })).rejects.toBeDefined();
  await expect(getFacultyStudentDetail(faculty,{
   deliveryId:f.deliveryId,membershipId:f.learnerMembershipId,
   collegeId:SEED_IDS.collegeB,
  })).rejects.toBeDefined();
 });

 it("marks attendance, requires a reason for corrections, rejects stale tokens and retains audit history",async()=>{
  const f=await fixture();
  // CI runs attendance suites concurrently. Sharing the seeded Faculty actor
  // creates overlapping sessions in PostgreSQL's faculty exclusion constraint.
  // Give this registered attendance journey an isolated, persisted teacher.
  const attendanceFacultyUserId=randomUUID(),attendanceFacultyMembershipId=randomUUID();
  const sessionFaculty:RequestContext={
   user:{...faculty.user,id:attendanceFacultyUserId,
    identityUid:"c4rh-attendance-"+attendanceFacultyUserId},
   membership:{...faculty.membership!,id:attendanceFacultyMembershipId},
  };
  await pool.query(
   "insert into users (id,identity_uid,email,display_name,platform_status) values ($1,$2,$3,$4,'ACTIVE')",
   [attendanceFacultyUserId,sessionFaculty.user.identityUid,
    "c4rh-attendance-"+attendanceFacultyUserId+"@example.invalid","C4 Report Attendance Faculty"],
  );
  await pool.query(
   "insert into college_memberships (id,user_id,college_id,status) values ($1,$2,$3,'ACTIVE')",
   [attendanceFacultyMembershipId,attendanceFacultyUserId,SEED_IDS.collegeA],
  );
  f.attendanceFacultyUserId=attendanceFacultyUserId;
  f.attendanceFacultyMembershipId=attendanceFacultyMembershipId;
  await pool.query(
   "insert into membership_roles (id,membership_id,role) values ($1,$2,'FACULTY')",
   [randomUUID(),attendanceFacultyMembershipId],
  );
  await createCourseTeachingAssignment(admin,{
   deliveryId:f.deliveryId,membershipId:attendanceFacultyMembershipId,role:"CO_TEACHER",
  });
  const now=Date.now();
  const event=await createFacultyAttendanceSession(sessionFaculty,{
   deliveryId:f.deliveryId,title:"Faculty C4 Attendance acceptance",
   description:"Real Section roll call",location:"Lab C4",
   startsAt:new Date(now-3*60_000).toISOString(),
   endsAt:new Date(now+20*60_000).toISOString(),
  });
  const initial=await getFacultyAttendanceWorkspace(sessionFaculty,f.deliveryId);
  expect(initial.roster.map(row=>row.membershipId)).toContain(f.learnerMembershipId);
  expect(initial.sessions.find(row=>row.id===event.id)?.attendanceStatus).toBeNull();
  const first=await markFacultyAttendance(sessionFaculty,event.id,{
   deliveryId:f.deliveryId,absentMembershipIds:[],
   presentMembershipIds:[f.learnerMembershipId],
  });
  expect(first.markedPresent).toBe(1);
  expect(first.markedAbsent).toBe(0);
  expect((await getFacultyAttendanceWorkspace(sessionFaculty,f.deliveryId)).sessions
    .find(row=>row.id===event.id)?.attendanceStatus).toBe("MARKED");
  const correction={
   deliveryId:f.deliveryId,absentMembershipIds:[f.learnerMembershipId],
   presentMembershipIds:[],expectedMarkedAt:first.markedAt.toISOString(),
   correctionReason:"Learner was absent at roll call",
  };
  await expect(markFacultyAttendance(sessionFaculty,event.id,{
   ...correction,correctionReason:"short",
  })).rejects.toBeDefined();
  const second=await markFacultyAttendance(sessionFaculty,event.id,correction);
  expect(second.markedAbsent).toBe(1);
  expect(second.markedAt.getTime()).toBeGreaterThan(first.markedAt.getTime());
  const persisted=await getFacultyAttendanceWorkspace(sessionFaculty,f.deliveryId);
  expect(persisted.records.filter(row=>row.scheduleEventId===event.id))
   .toEqual([expect.objectContaining({
    membershipId:f.learnerMembershipId,status:"ABSENT",
   })]);
  await expect(markFacultyAttendance(sessionFaculty,event.id,correction)).rejects.toBeDefined();
  await expect(markFacultyAttendance(sessionFaculty,event.id,{
   ...correction,expectedMarkedAt:second.markedAt.toISOString(),
  })).rejects.toBeDefined();
  await expect(markFacultyAttendance(learner,event.id,correction)).rejects.toBeDefined();
  await expect(markFacultyAttendance(sessionFaculty,SEED_IDS.collegeB,correction)).rejects.toBeDefined();
  await expect(markFacultyAttendance(sessionFaculty,event.id,{
   ...correction,expectedMarkedAt:second.markedAt.toISOString(),
   collegeId:SEED_IDS.collegeB,
  })).rejects.toBeDefined();
  const audit=await pool.query<{summary:string}>(
   "select summary from activity_events where subject_id=$1 and summary like 'Class attendance%' order by occurred_at",
   [event.id],
  );
  expect(audit.rows.map(row=>row.summary).sort()).toEqual([
   "Class attendance corrected","Class attendance marked",
  ]);
 });
 it("keeps Faculty alternate contacts blocked even for a real authorized Faculty-only profile",async()=>{
  // Seeded College A Faculty ALSO has MENTOR: the self-profile permission
  // deliberately rejects mixed roles. Use the same isolated Faculty-only
  // principal shape as faculty-mentor-positive-courses.test.ts.
  const suffix=randomUUID();
  const userId=randomUUID(), membershipId=randomUUID(), roleId=randomUUID();
  const facultyOnly:RequestContext={
   user:{id:userId,identityUid:"c4rh-faculty-"+suffix,
    platformStatus:"ACTIVE",systemRoles:[]},
   membership:{id:membershipId,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["FACULTY"]},
  };
  try{
   await pool.query(
    "insert into users (id,identity_uid,email,display_name,platform_status) values ($1,$2,$3,$4,'ACTIVE')",
    [userId,facultyOnly.user.identityUid,"c4rh-"+suffix+"@example.invalid","C4 Report Faculty "+suffix],
   );
   await pool.query(
    "insert into college_memberships (id,user_id,college_id,status) values ($1,$2,$3,'ACTIVE')",
    [membershipId,userId,SEED_IDS.collegeA],
   );
   await pool.query(
    "insert into membership_roles (id,membership_id,role) values ($1,$2,'FACULTY')",
    [roleId,membershipId],
   );
   const allowed=await getOwnFacultyContactAvailability(facultyOnly,{});
   expect(allowed.editable).toBe(false);
   expect(allowed.alternatePhone).toBeNull();
   expect(allowed.contactEmail).toBeNull();
   await expect(getOwnFacultyContactAvailability(learner,{})).rejects.toBeDefined();
   await expect(getOwnFacultyContactAvailability(facultyOnly,{alternatePhone:"9999"})).rejects.toBeDefined();
   // The dual-role seeded principal must continue to be refused; do not
   // weaken the product's Faculty-only self-profile policy to pass a test.
   // This seed actually carries both persisted FACULTY and MENTOR grants.
   // The authenticated context must expose the same grants, not a fabricated
   // FACULTY-only role list that would bypass the intended denial.
   const dualRoleFaculty:RequestContext={
    ...faculty,membership:{...faculty.membership!,roles:["FACULTY","MENTOR"]},
   };
   await expect(getOwnFacultyContactAvailability(dualRoleFaculty,{})).rejects.toBeDefined();
  }finally{
   await pool.query("delete from faculty_profiles where membership_id=$1",[membershipId]);
   await pool.query("delete from membership_roles where membership_id=$1",[membershipId]);
   const notifications=await pool.query(
    "select 1 from in_app_notifications where user_id=$1::uuid limit 1",[userId],
   );
   if(!notifications.rowCount){
    await pool.query("delete from college_memberships where id=$1",[membershipId]);
    await pool.query("delete from users where id=$1",[userId]);
   }
  }
 });
});
