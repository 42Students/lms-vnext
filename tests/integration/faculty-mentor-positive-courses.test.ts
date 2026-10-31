import { deleteDisposableFixtureGradeEvents } from "../support/db045-immutable-grade-fixture-cleanup.mjs";
import { requireLearningReadAccess, requireDeliveryContentMutation } from "@/modules/courses/learning-access";
import { facultySubmissionReportSearchSchema } from "@/modules/courses/faculty-assignment-submissions-model";
import { facultyQuizAttemptSearchSchema } from "@/modules/courses/faculty-quiz-attempts-model";
import { getFacultySubmissionReviewPage } from "@/modules/courses/faculty-submission-review-service";
import { facultySubmissionContentView } from "@/modules/courses/faculty-submission-content-model";
import { getFacultyCourseList } from "@/modules/courses/faculty-course-list-service";
import { facultyScheduleInstants } from "@/modules/attendance/faculty-schedule-editor-model";
import { commandFacultyAttendanceSchedule } from "@/modules/attendance/faculty-schedule-mutation-service";
import { facultyAssessmentFixtureToken } from "../support/faculty-assessment-token";
import { facultyAttendanceConfirmation } from "@/modules/attendance/faculty-correction-audit-model";
import { facultyGradeEditorState } from "@/modules/courses/faculty-grade-editor-model";
import { authoringDueInstant } from "@/modules/courses/faculty-authoring-datetime-model";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { deleteDisposableAttendanceEvents } from "../support/db045-attendance-fixture.mjs";
import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { createProgram } from "@/modules/academics/program-service";
import { createAcademicPeriod } from "@/modules/academics/period-service";
import { createCohort } from "@/modules/academics/cohort-service";
import { createSection } from "@/modules/academics/section-service";
import { createLearnerProgramEnrollment } from "@/modules/academics/enrollment-service";
import { assignLearnerToSection } from "@/modules/academics/roster-service";
import { createCourse } from "@/modules/courses/course-service";
import { createCourseOffering } from "@/modules/courses/offering-service";
import { createCourseSectionDelivery } from "@/modules/courses/delivery-service";
import { createCourseTeachingAssignment } from "@/modules/courses/teaching-assignment-service";
import { createLearningPath, transitionLearningPath } from "@/modules/courses/learning-path-service";
import { createCourseLesson } from "@/modules/courses/lesson-service";
import { createCourseAssignment, transitionCourseAssignment, updateCourseAssignment } from "@/modules/courses/assignment-service";
import {gradeAssignmentSubmission,publishAssignmentGrade,listAssignmentSubmissions} from "@/modules/courses/assignment-submission-service";
import {commandFacultyAssignment} from "@/modules/courses/faculty-assignment-authoring-service";
import {commandFacultyQuiz} from "@/modules/courses/faculty-quiz-authoring-service";
import {commandFacultyQuizResults} from "@/modules/courses/faculty-quiz-results-command-service";
import { createCourseQuiz, transitionCourseQuiz,setCourseQuizResults,updateCourseQuiz } from "@/modules/courses/quiz-service";
import { getFacultyCourseAssessmentHealth } from "@/modules/courses/faculty-course-health-service";
import {getFacultyCorrectionAvailability} from "@/modules/attendance/faculty-correction-service";
import {markFacultyAttendance} from "@/modules/attendance/faculty-service";
import {getFacultyPublishedGradebook,getFacultyPublishedGradebookLearner} from "@/modules/courses/faculty-gradebook-service";
import {facultyGradebookCsv} from "@/modules/courses/faculty-gradebook-model";
import { getFacultyAssessmentResults } from "@/modules/courses/faculty-results-service";
import { getFacultyResponseFollowUps } from "@/modules/courses/faculty-response-followup-service";
import { getFacultyReportCsvForDownload } from "@/modules/courses/faculty-report-csv-service";
import { getOwnFacultyTeachingSection } from "@/modules/courses/faculty-profile-teaching-service";
import { getFacultyContactDetail } from "@/modules/courses/faculty-contacts-service";
import { getFacultySectionNotices } from "@/modules/courses/faculty-notices-service";
import { getFacultyQuizAttemptDrilldown } from "@/modules/courses/faculty-quiz-attempts-service";
import { getFacultyIstMonth } from "@/modules/courses/faculty-ist-month-service";
import {getFacultyDiscussionParticipation} from "@/modules/courses/faculty-discussion-participation-service";
import {getFacultySessionCoverage} from "@/modules/courses/faculty-session-coverage-service";
import {postFacultyDiscussionReply} from "@/modules/courses/faculty-discussion-reply-service";
import {getFacultyDiscussionHistory} from "@/modules/courses/faculty-discussion-history-service";
import {createCourseDiscussionMessage,toggleCourseDiscussionPin,deleteCourseDiscussionMessage}
 from "@/modules/courses/discussion-service";
import { createSectionScheduleEvent } from "@/modules/academics/schedule-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
// Faculty authoring rejects past due dates and past sessions; derive IST
// calendar days from "now" so these positive paths never expire.
function istDate(offsetDays:number){
  return new Date(Date.now()+offsetDays*86400000+5.5*3600000).toISOString().slice(0,10);
}
const futureIstDay=istDate(30),futureIstPreviousDay=istDate(29);

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Requires disposable PostgreSQL TEST_DATABASE_URL (never production DATABASE_URL)");
}
const pool = new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
// Each test module gets its own identities and unique codes, avoiding clashes
// with a concurrent integration suite or an interrupted earlier run.
const runId = randomUUID().slice(0, 12).toUpperCase();
const codePrefix = "C4POS-" + runId;
const codePattern = codePrefix + "-%";
const facultyOnlyUserId = randomUUID();
const facultyOnlyMembershipId = randomUUID();
const facultyOnlyRoleId = randomUUID();
const testLearnerUserId = randomUUID();
const testLearnerMembershipId = randomUUID();
const testLearnerRoleId = randomUUID();
const facultyOnly: RequestContext = {
  user: {
    id: facultyOnlyUserId,
    identityUid: "c4pos-faculty-" + runId,
    platformStatus: "ACTIVE",
    systemRoles: [],
  },
  membership: {
    id: facultyOnlyMembershipId,
    collegeId: SEED_IDS.collegeA,
    organizationId: SEED_IDS.organization,
    status: "ACTIVE",
    roles: ["FACULTY"],
  },
};
const admin:RequestContext={
  user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const faculty:RequestContext={
  user:{id:SEED_IDS.facultyUser,identityUid:"seed-faculty",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["FACULTY","MENTOR"]},
};
const learner:RequestContext={
  user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,
    organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
};

async function cleanup() {
  // DB045 history RESTRICT protects current rows and schedules; only remove
  // this disposable test's immutable events with a guarded scoped teardown.
  const fixtureEvents=await pool.query<{id:string}>(`select e.id
    from section_schedule_events e
    join sections s on s.id=e.section_id
    join cohorts ch on ch.id=s.cohort_id
    join programs p on p.id=ch.program_id
    where p.code like $1`,[codePattern]);
  await deleteDisposableAttendanceEvents(pool,fixtureEvents.rows.map(r=>r.id));
  // Clean in reverse FK order, exclusively fixture rows identified by C4POS
  // course / program codes; do not modify shared seeded people or tenants.
  // Linked course rows cascade from the dedicated fixture schedule events.
  await pool.query(`delete from section_schedule_events where section_id in (
    select s.id from sections s join cohorts ch on ch.id=s.cohort_id
    join programs p on p.id=ch.program_id where p.code like $1)`, [codePattern]);
  await pool.query(`delete from in_app_notifications where event_id in
    (select ev.id from activity_events ev where ev.subject_id in
      (select a.id::text from course_assignments a join course_lessons l on l.id=a.lesson_id
        join course_learning_paths lp on lp.id=l.learning_path_id
        join course_offerings co on co.id=lp.offering_id
        join courses c on c.id=co.course_id where c.code like $1))`, [codePattern]);
  // Preserve immutable activity_events. Other fixture teardown must not erase audit history.
  await pool.query(`delete from quiz_options where question_id in (
    select question.id from quiz_questions question join course_quizzes quiz on quiz.id=question.quiz_id
    join course_lessons l on l.id=quiz.lesson_id join course_learning_paths lp on lp.id=l.learning_path_id
    join course_offerings co on co.id=lp.offering_id join courses c on c.id=co.course_id
    where c.code like $1)`, [codePattern]);
  await pool.query(`delete from quiz_questions where quiz_id in (
    select quiz.id from course_quizzes quiz join course_lessons l on l.id=quiz.lesson_id
    join course_learning_paths lp on lp.id=l.learning_path_id
    join course_offerings co on co.id=lp.offering_id join courses c on c.id=co.course_id
    where c.code like $1)`, [codePattern]);
  // Remove only the disposable C4POS fixture's restricted grade events.
  await deleteDisposableFixtureGradeEvents(pool, `delete from assignment_grade_events where assignment_submission_id in (
    select s.id from assignment_submissions s
    join course_assignments a on a.id=s.assignment_id
    join course_lessons l on l.id=a.lesson_id
    join course_learning_paths lp on lp.id=l.learning_path_id
    join course_offerings o on o.id=lp.offering_id
    join courses c on c.id=o.course_id where c.code like $1)`,[codePattern]);
  await pool.query(`delete from assignment_submissions where assignment_id in (
    select a.id from course_assignments a join course_lessons l on l.id=a.lesson_id
    join course_learning_paths lp on lp.id=l.learning_path_id
    join course_offerings o on o.id=lp.offering_id join courses c on c.id=o.course_id
    where c.code like $1)`,[codePattern]);
  for(const table of ["course_quizzes","course_assignments"]) {
    await pool.query(`delete from ${table} where lesson_id in (
      select l.id from course_lessons l join course_learning_paths lp on lp.id=l.learning_path_id
      join course_offerings co on co.id=lp.offering_id join courses c on c.id=co.course_id
      where c.code like $1)`, [codePattern]);
  }
  await pool.query(`delete from course_lessons where learning_path_id in (
    select lp.id from course_learning_paths lp join course_offerings co on co.id=lp.offering_id
    join courses c on c.id=co.course_id where c.code like $1)`, [codePattern]);
  await pool.query(`delete from course_learning_paths where offering_id in (
    select co.id from course_offerings co join courses c on c.id=co.course_id
    where c.code like $1)`, [codePattern]);
  await pool.query(`delete from course_teaching_assignments where delivery_id in (
    select d.id from course_section_deliveries d join course_offerings co on co.id=d.offering_id
    join courses c on c.id=co.course_id where c.code like $1)`, [codePattern]);
  await pool.query(`delete from course_section_deliveries where offering_id in (
    select co.id from course_offerings co join courses c on c.id=co.course_id
    where c.code like $1)`, [codePattern]);
  await pool.query(`delete from course_offerings where course_id in (
    select id from courses where code like $1)`, [codePattern]);
  await pool.query("delete from program_term_courses where course_id in (select id from courses where code like $1)", [codePattern]);
  await pool.query("delete from courses where code like $1", [codePattern]);
  await pool.query(`delete from section_enrollments where learner_enrollment_id in (
    select e.id from learner_program_enrollments e
    join programs p on p.id=e.program_id where p.code like $1)`, [codePattern]);
  await pool.query(`delete from learner_program_enrollments where program_id in (
    select id from programs where code like $1)`, [codePattern]);
  await pool.query(`delete from sections where cohort_id in (
    select c.id from cohorts c join programs p on p.id=c.program_id where p.code like $1)`, [codePattern]);
  await pool.query(`delete from cohorts where program_id in (
    select id from programs where code like $1)`, [codePattern]);
  await pool.query("delete from program_terms where program_id in (select id from programs where code like $1)", [codePattern]);
  await pool.query("delete from programs where code like $1", [codePattern]);
  await pool.query("delete from academic_periods where code like $1", [codePattern]);
  // Only the principal created by THIS suite: do not mutate deterministic seed users.
  await pool.query("delete from faculty_profiles where membership_id = $1", [facultyOnlyMembershipId]);
  await pool.query("delete from learner_profiles where membership_id = $1", [testLearnerMembershipId]);
  await pool.query("delete from membership_roles where membership_id = $1", [testLearnerMembershipId]);
  await pool.query("delete from college_memberships where id = $1 and not exists (select 1 from activity_events where actor_membership_id = $1)", [testLearnerMembershipId]);
  await pool.query("delete from in_app_notifications where user_id = any($1::uuid[])", [[testLearnerUserId, facultyOnlyUserId]]);
  await pool.query("delete from users where id = $1 and not exists (select 1 from college_memberships where user_id = $1)", [testLearnerUserId]);
  await pool.query("delete from membership_roles where membership_id = $1", [facultyOnlyMembershipId]);
  await pool.query("delete from college_memberships where id = $1 and not exists (select 1 from activity_events where actor_membership_id = $1)", [facultyOnlyMembershipId]);
  await pool.query("delete from users where id = $1 and not exists (select 1 from college_memberships where user_id = $1)", [facultyOnlyUserId]);
}
async function fixture() {
  const program=await createProgram(admin,{
    departmentId:SEED_IDS.departmentA,name:"Chat4 Positive CS " + runId,code:codePrefix+"-PROGRAM",durationTerms:8,
  });
  const period=await createAcademicPeriod(admin,{
    collegeId:SEED_IDS.collegeA,name:"Chat4 Positive Semester " + runId,
    code:codePrefix+"-PERIOD",startDate:"2026-07-01",endDate:istDate(400)>"2027-12-31"?istDate(400):"2027-12-31",
  });
  const cohort=await createCohort(admin,{
    programId:program.id,name:"Chat4 Intake " + runId,code:codePrefix+"-COHORT",startPeriodId:period.id,
  });
  const section=await createSection(admin,{
    cohortId:cohort.id,academicPeriodId:period.id,name:"Chat4 Section A " + runId,code:codePrefix+"-A",
  });
  const course=await createCourse(admin,{
    departmentId:SEED_IDS.departmentA,name:"Chat4 Algorithms " + runId,code:codePrefix+"-ALG",
  });
  const offering=await createCourseOffering(admin,{
    courseId:course.id,cohortId:cohort.id,academicPeriodId:period.id,
    type:"CORE",credits:4,displayOrder:0,
  });
  const delivery=await createCourseSectionDelivery(admin,{
    offeringId:offering.id,sectionId:section.id,
  });
  await createCourseTeachingAssignment(admin,{
    deliveryId:delivery.id,membershipId:SEED_IDS.facultyCollegeAMembership,role:"PRIMARY",
  });
  await createCourseTeachingAssignment(admin,{
    deliveryId:delivery.id,membershipId:facultyOnlyMembershipId,role:"CO_TEACHER",
  });
  const enrollment=await createLearnerProgramEnrollment(admin,{
    membershipId:testLearnerMembershipId,programId:program.id,cohortId:cohort.id,
  });
  await assignLearnerToSection(admin,{
    learnerEnrollmentId:enrollment.id,sectionId:section.id,
  });
  const path=await createLearningPath(admin,{
    offeringId:offering.id,title:"Chat4 Learning Path " + runId,
  });
  const lesson=await createCourseLesson(admin,{
    learningPathId:path.id,name:"Chat4 Fundamentals " + runId,sequence:0,
  });
  await transitionLearningPath(admin,path.id,{action:"PUBLISH"});
  const assignment=await createCourseAssignment(faculty,{
    lessonId:lesson.id,deliveryId:delivery.id,title:"Chat4 Assignment " + runId,maxPoints:10,sequence:0,dueAt:"2099-01-01T00:00:00.000Z",
  });
  const quiz=await createCourseQuiz(faculty,{
    lessonId:lesson.id,deliveryId:delivery.id,title:"Chat4 Quiz " + runId,maxAttempts:2,dueAt:"2099-01-01T00:00:00.000Z",shuffleQuestions:false,shuffleOptions:false,sequence:1,
    questions:[{
      type:"SINGLE_CHOICE",prompt:"Which is FIFO?",points:5,sequence:0,
      options:[{text:"Queue",correct:true,sequence:0},{text:"Stack",correct:false,sequence:1}],
    }],
  });
  await transitionCourseAssignment(faculty,assignment.id,{...await facultyAssessmentFixtureToken(pool,"ASSIGNMENT",assignment.id), action:"PUBLISH"});
  await transitionCourseQuiz(faculty,quiz.id,{...await facultyAssessmentFixtureToken(pool,"QUIZ",quiz.id), action:"PUBLISH"});
  return {delivery,section,assignment,quiz};
}
async function seedFacultyOnly() {
  // The seeded learner already belongs to a programme. DB02 explicitly
  // forbids a second active programme enrolment per membership; use a fresh
  // active learner principal so positive-path tests reflect production rules.
  await pool.query(
    "insert into users (id, identity_uid, email, display_name, platform_status) values ($1, $2, $3, $4, 'ACTIVE') on conflict (id) do nothing",
    [testLearnerUserId, "c4pos-learner-" + runId,
      "c4pos-learner-" + runId.toLowerCase() + "@example.invalid",
      "Chat4 Learner " + runId],
  );
  await pool.query(
    "insert into college_memberships (id, user_id, college_id, status) values ($1, $2, $3, 'ACTIVE') on conflict (id) do nothing",
    [testLearnerMembershipId, testLearnerUserId, SEED_IDS.collegeA],
  );
  await pool.query(
    "insert into membership_roles (id, membership_id, role) values ($1, $2, 'LEARNER') on conflict (id) do nothing",
    [testLearnerRoleId, testLearnerMembershipId],
  );
  await pool.query(
    "insert into users (id, identity_uid, email, display_name, platform_status) values ($1, $2, $3, $4, 'ACTIVE') on conflict (id) do nothing",
    [facultyOnlyUserId, facultyOnly.user.identityUid,
      "c4pos-faculty-" + runId.toLowerCase() + "@example.invalid",
      "Chat4 Faculty " + runId],
  );
  await pool.query(
    "insert into college_memberships (id, user_id, college_id, status) values ($1, $2, $3, 'ACTIVE') on conflict (id) do nothing",
    [facultyOnlyMembershipId, facultyOnlyUserId, SEED_IDS.collegeA],
  );
  await pool.query(
    "insert into membership_roles (id, membership_id, role) values ($1, $2, 'FACULTY') on conflict (id) do nothing",
    [facultyOnlyRoleId, facultyOnlyMembershipId],
  );
}
beforeEach(async () => {
  await cleanup();
  await seedFacultyOnly();
});
afterAll(async()=>{
  try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}
});

describe("Chat4 Faculty SUCCESS paths against disposable PostgreSQL",()=>{
  it("authors Section quiz questions with stale, wrong-role, and foreign-scope denial",async()=>{
    const {delivery}=await fixture();
    const lessonRow=await pool.query<{id:string}>(`
      select l.id from course_lessons l join course_learning_paths lp on lp.id=l.learning_path_id
      join course_offerings o on o.id=lp.offering_id
      where o.id=(select offering_id from course_section_deliveries where id=$1) limit 1`,[delivery.id]);
    const questions=[{type:"SINGLE_CHOICE" as const,prompt:"Original question",points:5,sequence:0,
      options:[{text:"Correct",correct:true,sequence:0},{text:"Wrong",correct:false,sequence:1}]}];
    const draft=await commandFacultyQuiz(facultyOnly,{deliveryId:delivery.id},{
      action:"CREATE",lessonId:lessonRow.rows[0]!.id,sequence:15,
      title:"Faculty quiz "+runId,description:null,dueAt:"2099-01-01T00:00:00.000Z",maxAttempts:2,
      questions,confirmed:true,
    });
    const revised=await commandFacultyQuiz(facultyOnly,{deliveryId:delivery.id},{
      action:"EDIT",quizId:draft.id,expectedUpdatedAt:draft.updatedAt.toISOString(),
      title:"Revised quiz "+runId,description:null,dueAt:"2099-01-01T00:00:00.000Z",maxAttempts:2,
      questions:[{...questions[0],prompt:"Revised question"}],confirmed:true,
    });
    expect(revised.totalPoints).toBe(5);
    await expect(commandFacultyQuiz(facultyOnly,{deliveryId:delivery.id},{
      action:"PUBLISH",quizId:draft.id,
      expectedUpdatedAt:draft.updatedAt.toISOString(),confirmed:true,
    })).rejects.toBeDefined();
    await expect(commandFacultyQuiz(learner,{deliveryId:delivery.id},{
      action:"PUBLISH",quizId:draft.id,
      expectedUpdatedAt:revised.updatedAt.toISOString(),confirmed:true,
    })).rejects.toBeDefined();
    await expect(commandFacultyQuiz(facultyOnly,{deliveryId:SEED_IDS.collegeB},{
      action:"PUBLISH",quizId:draft.id,
      expectedUpdatedAt:revised.updatedAt.toISOString(),confirmed:true,
    })).rejects.toBeDefined();
    await expect(updateCourseQuiz(facultyOnly,draft.id,{title:"Missing token"})).rejects.toBeDefined();
    const questionIdsBefore=await pool.query<{id:string}>("select id from quiz_questions where quiz_id=$1 order by id",[draft.id]);
    const metadata=await updateCourseQuiz(facultyOnly,draft.id,{
      title:"Quiz metadata drawer "+runId,expectedUpdatedAt:revised.updatedAt.toISOString(),confirmed:true,
    });
    expect(metadata.totalPoints).toBe(5);
    const questionIdsAfter=await pool.query<{id:string}>("select id from quiz_questions where quiz_id=$1 order by id",[draft.id]);
    expect(questionIdsAfter.rows).toEqual(questionIdsBefore.rows);
    await expect(updateCourseQuiz(facultyOnly,draft.id,{
      title:"Stale metadata",expectedUpdatedAt:revised.updatedAt.toISOString(),confirmed:true,
    })).rejects.toMatchObject({code:"FACULTY_QUIZ_STALE_VERSION"});
    await expect(updateCourseQuiz(learner,draft.id,{title:"Wrong role",expectedUpdatedAt:metadata.updatedAt.toISOString(),confirmed:true})).rejects.toBeDefined();
    await expect(updateCourseQuiz({...facultyOnly,membership:{...facultyOnly.membership!,collegeId:SEED_IDS.collegeB}},draft.id,{title:"Foreign",expectedUpdatedAt:metadata.updatedAt.toISOString(),confirmed:true})).rejects.toBeDefined();
    await expect(transitionCourseQuiz(facultyOnly,draft.id,{action:"PUBLISH"})).rejects.toBeDefined();
    const published=await transitionCourseQuiz(facultyOnly,draft.id,{
      action:"PUBLISH",expectedUpdatedAt:metadata.updatedAt.toISOString(),confirmed:true,
    });
    await expect(transitionCourseQuiz(facultyOnly,draft.id,{action:"CLOSE",expectedUpdatedAt:metadata.updatedAt.toISOString(),confirmed:true})).rejects.toMatchObject({code:"FACULTY_QUIZ_STALE_VERSION"});
    // Metadata-only edits of a published quiz are allowed (CAS-audited); replacing its question bank is not.
    await expect(updateCourseQuiz(facultyOnly,draft.id,{title:"Published bypass",questions:[{...questions[0],prompt:"Published rewrite"}],expectedUpdatedAt:published.updatedAt.toISOString(),confirmed:true})).rejects.toMatchObject({code:"INVALID_QUIZ_TRANSITION"});
    const questionIdsPublished=await pool.query<{id:string}>("select id from quiz_questions where quiz_id=$1 order by id",[draft.id]);
    expect(questionIdsPublished.rows).toEqual(questionIdsBefore.rows);
    expect(published.status).toBe("PUBLISHED");
    await expect(updateCourseQuiz(facultyOnly,draft.id,{
      maxAttempts:3,expectedUpdatedAt:published.updatedAt.toISOString(),confirmed:true,
    })).rejects.toMatchObject({code:"INVALID_QUIZ_TRANSITION"});
    const events=await pool.query<{event_type:string}>(`
      select event_type from activity_events where subject_id=$1::text
      and event_type like 'courses.quiz.%'`,[draft.id]);
    expect(events.rows.map(row=>row.event_type).sort()).toEqual([
      "courses.quiz.created","courses.quiz.published","courses.quiz.updated","courses.quiz.updated",
    ]);
    await pool.query("delete from membership_roles where id=$1",[facultyOnlyRoleId]);
    await expect(commandFacultyQuiz(facultyOnly,{deliveryId:delivery.id},{
      action:"EDIT",quizId:draft.id,expectedUpdatedAt:published.updatedAt.toISOString(),
      title:"Revoked Faculty cannot edit",description:null,dueAt:null,maxAttempts:2,confirmed:true,
    })).rejects.toMatchObject({code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
    await pool.query("insert into membership_roles(id,membership_id,role) values($1,$2,'FACULTY')",
      [facultyOnlyRoleId,facultyOnlyMembershipId]);
  });
  it("writes a confirmed own-Section assignment draft with row-locked stale and wrong-role denial",async()=>{
    const {delivery}=await fixture();
    const lessonRow=await pool.query<{id:string}>(`
      select l.id from course_lessons l join course_learning_paths lp on lp.id=l.learning_path_id
      join course_offerings o on o.id=lp.offering_id
      where o.id=(select offering_id from course_section_deliveries where id=$1)
      limit 1`,[delivery.id]);
    const lessonId=lessonRow.rows[0]!.id;
    const created=await commandFacultyAssignment(facultyOnly,{deliveryId:delivery.id},{
      action:"CREATE",lessonId,sequence:10,title:"Faculty owned draft "+runId,
      description:"Text only",dueAt:authoringDueInstant(futureIstDay+"T09:30"),maxPoints:15,confirmed:true,
    });
    expect(created.status).toBe("DRAFT");
    const edited=await commandFacultyAssignment(facultyOnly,{deliveryId:delivery.id},{
      action:"EDIT",assignmentId:created.id,expectedUpdatedAt:created.updatedAt.toISOString(),
      title:"Revised draft "+runId,description:"Updated text",dueAt:authoringDueInstant(futureIstDay+"T00:15"),maxPoints:20,
      confirmed:true,
    });
    expect(created.dueAt?.toISOString()).toBe(futureIstDay+"T04:00:00.000Z");
    expect(edited.dueAt?.toISOString()).toBe(futureIstPreviousDay+"T18:45:00.000Z");
    expect(edited.maxPoints).toBe(20);
    await expect(commandFacultyAssignment(facultyOnly,{deliveryId:delivery.id},{
      action:"EDIT",assignmentId:created.id,expectedUpdatedAt:created.updatedAt.toISOString(),
      title:"Stale write",description:"No",dueAt:null,maxPoints:5,confirmed:true,
    })).rejects.toBeDefined();
    await expect(commandFacultyAssignment(learner,{deliveryId:delivery.id},{
      action:"ARCHIVE",assignmentId:created.id,
      expectedUpdatedAt:edited.updatedAt.toISOString(),confirmed:true,
    })).rejects.toBeDefined();
    await expect(commandFacultyAssignment(facultyOnly,{deliveryId:SEED_IDS.collegeB},{
      action:"ARCHIVE",assignmentId:created.id,
      expectedUpdatedAt:edited.updatedAt.toISOString(),confirmed:true,
    })).rejects.toBeDefined();
    await expect(updateCourseAssignment(facultyOnly,created.id,{title:"Unversioned bypass"})).rejects.toBeDefined();
    const throughDrawer=await updateCourseAssignment(facultyOnly,created.id,{
      title:"Confirmed drawer draft "+runId, expectedUpdatedAt:edited.updatedAt.toISOString(),confirmed:true,
    });
    expect(throughDrawer.title).toContain("Confirmed drawer draft");
    await expect(updateCourseAssignment(facultyOnly,created.id,{
      title:"Stale drawer replay",expectedUpdatedAt:edited.updatedAt.toISOString(),confirmed:true,
    })).rejects.toMatchObject({code:"FACULTY_ASSIGNMENT_STALE_VERSION"});
    await expect(updateCourseAssignment(learner,created.id,{
      title:"Wrong role",expectedUpdatedAt:throughDrawer.updatedAt.toISOString(),confirmed:true,
    })).rejects.toBeDefined();
    await expect(updateCourseAssignment({...facultyOnly,membership:{...facultyOnly.membership!,collegeId:SEED_IDS.collegeB}},created.id,{
      title:"Foreign drawer",expectedUpdatedAt:throughDrawer.updatedAt.toISOString(),confirmed:true,
    })).rejects.toBeDefined();
    await expect(transitionCourseAssignment(facultyOnly,created.id,{action:"PUBLISH"})).rejects.toBeDefined();
    const lifecycleToken={expectedUpdatedAt:throughDrawer.updatedAt.toISOString(),confirmed:true as const};
    await expect(transitionCourseAssignment(learner,created.id,{action:"PUBLISH",...lifecycleToken})).rejects.toBeDefined();
    await expect(transitionCourseAssignment({...facultyOnly,membership:{...facultyOnly.membership!,collegeId:SEED_IDS.collegeB}},created.id,{action:"PUBLISH",...lifecycleToken})).rejects.toBeDefined();
    const released=await transitionCourseAssignment(facultyOnly,created.id,{action:"PUBLISH",...lifecycleToken});
    expect(released.status).toBe("PUBLISHED");
    await expect(transitionCourseAssignment(facultyOnly,created.id,{action:"ARCHIVE",...lifecycleToken})).rejects.toMatchObject({code:"FACULTY_ASSIGNMENT_STALE_VERSION"});
    const lifecycleAudit=await pool.query<{count:number}>("select count(*)::int as count from activity_events where subject_id=$1::text and event_type='courses.assignment.published'",[created.id]);
    expect(lifecycleAudit.rows[0]?.count).toBe(1);
    const events=await pool.query<{event_type:string}>(`
      select event_type from activity_events where subject_id=$1::text
      and event_type in ('courses.assignment.created','courses.assignment.updated')`,[created.id]);
    expect(events.rows.map(x=>x.event_type).sort()).toEqual([
      "courses.assignment.created","courses.assignment.updated","courses.assignment.updated",
    ]);
  });
  it("filters actual Faculty reply audit with exact Section and non-leaking denial",async()=>{
    const {delivery}=await fixture();
    const parent=await createCourseDiscussionMessage(facultyOnly,delivery.id,{
      messageText:"Question from registered Section",
    });
    const reply=await postFacultyDiscussionReply(facultyOnly,delivery.id,{
      replyToMessageId:parent.id,expectedParentUpdatedAt:parent.updatedAt.toISOString(),
      confirmed:true,messageText:"Answer using the course reading",
    });
    const history=await getFacultyDiscussionHistory(facultyOnly,{
      deliveryId:delivery.id,action:"REPLY",
    });
    expect(history.total).toBe(1);
    expect(history.items[0]).toMatchObject({subjectId:reply.id,
      action:"Faculty reply recorded"});
    expect(JSON.stringify(history.items)).not.toContain("Answer using the course reading");
    await expect(getFacultyDiscussionHistory(learner,{deliveryId:delivery.id,action:"REPLY"}))
      .rejects.toBeDefined();
    await expect(getFacultyDiscussionHistory(facultyOnly,{
      deliveryId:SEED_IDS.collegeB,action:"REPLY",
    })).rejects.toBeDefined();
    await expect(getFacultyDiscussionHistory(facultyOnly,{
      deliveryId:delivery.id,action:"REPLY",collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
  it("writes version-checked Faculty reply against locked Section parent, with immutable audit",async()=>{
    const {delivery}=await fixture();
    const parent=await createCourseDiscussionMessage(facultyOnly,delivery.id,{
      messageText:"Parent message "+runId,
    });
    const input={messageText:"Faculty answer with evidence",replyToMessageId:parent.id,
      expectedParentUpdatedAt:parent.updatedAt.toISOString(),confirmed:true as const};
    await expect(postFacultyDiscussionReply(learner,delivery.id,input)).rejects.toBeDefined();
    await expect(postFacultyDiscussionReply({
      ...facultyOnly,membership:{...facultyOnly.membership!,collegeId:SEED_IDS.collegeB},
    },delivery.id,input)).rejects.toBeDefined();
    await expect(postFacultyDiscussionReply(facultyOnly,delivery.id,{
      ...input,replyToMessageId:SEED_IDS.collegeB,
    })).rejects.toMatchObject({code:"DISCUSSION_MESSAGE_NOT_FOUND"});
    await expect(postFacultyDiscussionReply(facultyOnly,delivery.id,{
      ...input,expectedParentUpdatedAt:"2026-01-01T00:00:00.000Z",
    })).rejects.toMatchObject({code:"DISCUSSION_STALE_VERSION"});
    const reply=await postFacultyDiscussionReply(facultyOnly,delivery.id,input);
    expect(reply.messageText).toContain("Faculty answer with evidence");
    const events=await pool.query<{n:string}>(`select count(*)::text as n from activity_events
      where subject_id=$1::text and event_type='courses.discussion.replied'`,[reply.id]);
    expect(events.rows[0]?.n).toBe("1");
    await deleteCourseDiscussionMessage(facultyOnly,parent.id,delivery.id,{
      expectedUpdatedAt:parent.updatedAt.toISOString(),confirmed:true,
    });
    await expect(postFacultyDiscussionReply(facultyOnly,delivery.id,input))
      .rejects.toMatchObject({code:"DISCUSSION_MESSAGE_NOT_FOUND"});
  });
  it("pins and deletes own-Section discussion with microsecond CAS, audit and denial",async()=>{
    const {delivery}=await fixture();
    const posted=await createCourseDiscussionMessage(facultyOnly,delivery.id,{
      messageText:"Moderated course thread "+runId,
    });
    const version={expectedUpdatedAt:posted.updatedAt.toISOString(),confirmed:true};
    const pinned=await toggleCourseDiscussionPin(facultyOnly,posted.id,delivery.id,version);
    expect(pinned.pinned).toBe(true);
    await expect(toggleCourseDiscussionPin(facultyOnly,posted.id,delivery.id,version))
      .rejects.toBeDefined();
    await expect(toggleCourseDiscussionPin(learner,posted.id,delivery.id,{
      expectedUpdatedAt:pinned.updatedAt.toISOString(),confirmed:true,
    })).rejects.toBeDefined();
    await expect(deleteCourseDiscussionMessage(facultyOnly,posted.id,SEED_IDS.collegeB,{
      expectedUpdatedAt:pinned.updatedAt.toISOString(),confirmed:true,
    })).rejects.toBeDefined();
    await expect(deleteCourseDiscussionMessage(facultyOnly,posted.id,delivery.id,version))
      .rejects.toBeDefined();
    const deleted=await deleteCourseDiscussionMessage(facultyOnly,posted.id,delivery.id,{
      expectedUpdatedAt:pinned.updatedAt.toISOString(),confirmed:true,
    });
    expect(deleted.id).toBe(posted.id);
    const events=await pool.query<{event_type:string}>(`
      select event_type from activity_events where subject_id=$1::text
      and event_type like 'courses.discussion.%'`,[posted.id]);
    expect(events.rows.map(x=>x.event_type).sort()).toEqual([
      "courses.discussion.deleted","courses.discussion.pin_changed",
      "courses.discussion.posted",
    ]);
  });
  it("grades a published Section submission, publishes, denies stale/foreign/role, and blocks archive grade",async()=>{
    const {delivery,assignment}=await fixture();
    const row=await pool.query<{id:string,version:number}>(`insert into assignment_submissions
      (assignment_id,delivery_id,membership_id,submission_type,text_content)
      values($1,$2,$3,'TEXT','Created by fixture') returning id,version`,
      [assignment.id,delivery.id,testLearnerMembershipId]);
    const id=row.rows[0]!.id;
    await expect(gradeAssignmentSubmission(learner,id,{
      pointsAwarded:7,expectedVersion:0,
    })).rejects.toBeDefined();
    await expect(gradeAssignmentSubmission({
      ...facultyOnly,membership:{...facultyOnly.membership!,collegeId:SEED_IDS.collegeB},
    },id,{pointsAwarded:7,expectedVersion:0})).rejects.toBeDefined();
    const graded=await gradeAssignmentSubmission(facultyOnly,id,{
      pointsAwarded:7,expectedVersion:0,feedback:"Good",
    });
    expect(graded.gradePublished).toBe(false);
    // The editor cannot publish a saved grade while its displayed draft differs.
    expect(facultyGradeEditorState(graded,"7","Good",10).canPublish).toBe(true);
    expect(facultyGradeEditorState(graded,"8","Good",10).canPublish).toBe(false);
    expect(facultyGradeEditorState(graded,"7","Revised feedback",10).canPublish).toBe(false);
    expect(facultyGradeEditorState(graded,"","Good",10).points).toBeNull();
    await expect(gradeAssignmentSubmission(facultyOnly,id,{
      pointsAwarded:7,feedback:"Good",expectedVersion:graded.version,
    })).rejects.toMatchObject({code:"ASSIGNMENT_GRADE_NO_CHANGE"});
    await expect(gradeAssignmentSubmission(facultyOnly,id,{
      pointsAwarded:9,expectedVersion:0,
    })).rejects.toBeDefined();
    const published=await publishAssignmentGrade(facultyOnly,id,{
      expectedVersion:graded.version,
    });
    expect(published.gradePublished).toBe(true);
    await expect(gradeAssignmentSubmission(facultyOnly,id,{
      pointsAwarded:6,expectedVersion:published.version,feedback:null,
    })).rejects.toMatchObject({code:"ASSIGNMENT_REGRADE_FEEDBACK_REQUIRED"});
    const regraded=await gradeAssignmentSubmission(facultyOnly,id,{
      pointsAwarded:6,expectedVersion:published.version,
      feedback:"Corrected using the published rubric",
    });
    expect(regraded.gradePublished).toBe(false);
    expect(regraded.feedback).toBe("Corrected using the published rubric");
    await expect(gradeAssignmentSubmission(facultyOnly,id,{
      pointsAwarded:5,expectedVersion:published.version,
      feedback:"Outdated browser replay",
    })).rejects.toMatchObject({code:"ASSIGNMENT_SUBMISSION_CONFLICT"});
    // A published assignment with submissions must NOT archive through the
    // command. Force the restricted state only in this disposable fixture
    // to verify the grading writer's fail-closed parent-status fence.
    await expect(transitionCourseAssignment(faculty,assignment.id,{...await facultyAssessmentFixtureToken(pool,"ASSIGNMENT",assignment.id), action:"ARCHIVE"}))
      .rejects.toBeDefined();
    await pool.query("update course_assignments set status='ARCHIVED' where id=$1",
      [assignment.id]);
    await expect(gradeAssignmentSubmission(facultyOnly,id,{
      pointsAwarded:6,expectedVersion:regraded.version,
    })).rejects.toMatchObject({code:"ASSIGNMENT_NOT_PUBLISHED"});
    const audit=await pool.query<{event_type:string}>(`select event_type from activity_events
      where subject_id=$1::text and event_type in
      ('courses.assignment.graded','courses.assignment.grade_published')`,[id]);
    expect(audit.rows.map(x=>x.event_type).sort()).toEqual([
      "courses.assignment.grade_published","courses.assignment.graded",
      "courses.assignment.graded",
    ]);
  });
  it("filters only persisted Faculty teaching deliveries and invalidates revoked assignments",async()=>{
    const {delivery}=await fixture();
    // facultyOnly holds the fixture's CO_TEACHER assignment; PRIMARY belongs to another Faculty member.
    const primaryOnly=await getFacultyCourseList(facultyOnly,{q:codePrefix,role:"PRIMARY"});
    expect(primaryOnly.items).toEqual([]);
    const list=await getFacultyCourseList(facultyOnly,{q:codePrefix,role:"CO_TEACHER",page:999});
    expect(list.items.map(item=>item.deliveryId)).toEqual([delivery.id]);
    expect(list.page).toBe(1);
    expect(list.items.length).toBeLessThanOrEqual(48);
    const foreignSelector=await getFacultyCourseList(facultyOnly,{period:SEED_IDS.collegeB});
    expect(foreignSelector.items).toEqual([]);
    await expect(getFacultyCourseList(learner,{})).rejects.toBeDefined();
    await expect(getFacultyCourseList(facultyOnly,{collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
    const foreign=await getFacultyCourseList({...facultyOnly,membership:{...facultyOnly.membership!,collegeId:SEED_IDS.collegeB}},{});
    expect(foreign.items).toEqual([]);
    await pool.query("update course_teaching_assignments set ended_at=now() where delivery_id=$1 and membership_id=$2",[delivery.id,facultyOnlyMembershipId]);
    const revoked=await getFacultyCourseList(facultyOnly,{});
    expect(revoked.items).toEqual([]);
    await pool.query("update course_teaching_assignments set ended_at=null where delivery_id=$1 and membership_id=$2",[delivery.id,facultyOnlyMembershipId]);
    await pool.query("update users set platform_status='DISABLED' where id=$1",[facultyOnlyUserId]);
    expect((await getFacultyCourseList(facultyOnly,{})).items).toEqual([]);
    await pool.query("update users set platform_status='ACTIVE' where id=$1",[facultyOnlyUserId]);
    await pool.query("delete from membership_roles where id=$1",[facultyOnlyRoleId]);
    expect((await getFacultyCourseList(facultyOnly,{})).items).toEqual([]);
    await pool.query("insert into membership_roles(id,membership_id,role) values($1,$2,'FACULTY')",
      [facultyOnlyRoleId,facultyOnlyMembershipId]);
    // Role removal ends the teaching assignment by trigger; re-granting the role does not revive it.
    expect((await getFacultyCourseList(facultyOnly,{q:codePrefix})).items).toEqual([]);
    await pool.query("update course_teaching_assignments set ended_at=null where delivery_id=$1 and membership_id=$2",[delivery.id,facultyOnlyMembershipId]);
    expect((await getFacultyCourseList(facultyOnly,{q:codePrefix})).items.map(row=>row.deliveryId))
      .toEqual([delivery.id]);
  });
  it("projects real submission content from an authorized Faculty reader without widening scope",async()=>{
    const {delivery,assignment}=await fixture();
    const row=await pool.query<{id:string}>("insert into assignment_submissions (assignment_id,delivery_id,membership_id,submission_type,text_content) values($1,$2,$3,'TEXT','Own learner response') returning id",[assignment.id,delivery.id,testLearnerMembershipId]);
    const submissions=await listAssignmentSubmissions(facultyOnly,assignment.id,delivery.id);
    const submission=submissions.find(item=>item.id===row.rows[0]!.id)!;
    expect(facultySubmissionContentView({id:submission.id,submissionType:submission.submissionType,
      textContent:submission.textContent,submissionUrl:submission.submissionUrl},false))
      .toEqual({kind:"TEXT",text:"Own learner response"});
    await expect(listAssignmentSubmissions(learner,assignment.id,delivery.id)).rejects.toBeDefined();
    await expect(listAssignmentSubmissions(facultyOnly,assignment.id,SEED_IDS.collegeB)).rejects.toBeDefined();
    await expect(listAssignmentSubmissions({...facultyOnly,membership:{...facultyOnly.membership!,collegeId:SEED_IDS.collegeB}},assignment.id,delivery.id)).rejects.toBeDefined();
  });
  it("pages actual Faculty grading submissions and rechecks publication and scope",async()=>{
    const {delivery,assignment}=await fixture();
    await pool.query("insert into assignment_submissions (assignment_id,delivery_id,membership_id,submission_type,text_content) values($1,$2,$3,'TEXT','Review fixture')",[assignment.id,delivery.id,testLearnerMembershipId]);
    const search=facultySubmissionReportSearchSchema.parse({deliveryId:delivery.id,filter:"UNGRADED",page:"999"});
    // The review drawer API is strict: it takes only the list selectors, not the report-only order/q/publication.
    const query={assignmentId:assignment.id,deliveryId:search.deliveryId,filter:search.filter,page:search.page};
    const pending=await getFacultySubmissionReviewPage(facultyOnly,query);
    expect(pending.total).toBe(1);expect(pending.page).toBe(1);
    expect(pending.items[0]?.submittedAt).toEqual(expect.any(String));
    const id=pending.items[0]!.id;
    await gradeAssignmentSubmission(facultyOnly,id,{pointsAwarded:7,feedback:"Graded fixture",expectedVersion:pending.items[0]!.version});
    expect((await getFacultySubmissionReviewPage(facultyOnly,query)).total).toBe(0);
    expect((await getFacultySubmissionReviewPage(facultyOnly,{...query,filter:"GRADED"})).total).toBe(1);
    await expect(getFacultySubmissionReviewPage(learner,query)).rejects.toBeDefined();
    await expect(getFacultySubmissionReviewPage(facultyOnly,{...query,deliveryId:SEED_IDS.collegeB})).rejects.toMatchObject({code:"ASSIGNMENT_SUBMISSION_NOT_FOUND"});
    await expect(getFacultySubmissionReviewPage(facultyOnly,{...query,assignmentId:SEED_IDS.collegeB})).rejects.toMatchObject({code:"ASSIGNMENT_SUBMISSION_NOT_FOUND"});
    await expect(getFacultySubmissionReviewPage(facultyOnly,{...query,collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
    await pool.query("update course_assignments set status='ARCHIVED' where id=$1",[assignment.id]);
    await expect(getFacultySubmissionReviewPage(facultyOnly,query)).rejects.toMatchObject({code:"ASSIGNMENT_NOT_PUBLISHED"});
  });
  it("reads a real Quiz attempt drill-in from strict search selectors without widening Section scope",async()=>{
    const {delivery,quiz}=await fixture();
    const search=facultyQuizAttemptSearchSchema.parse({deliveryId:delivery.id,page:"1"});
    const result=await getFacultyQuizAttemptDrilldown(facultyOnly,{quizId:quiz.id,...search});
    expect(result.quiz.id).toBe(quiz.id);expect(result.pageSize).toBe(10);
    expect(result.items).toEqual([]);
    await expect(getFacultyQuizAttemptDrilldown(learner,{quizId:quiz.id,...search})).rejects.toBeDefined();
    await expect(getFacultyQuizAttemptDrilldown(facultyOnly,{quizId:quiz.id,...search,deliveryId:SEED_IDS.collegeB})).rejects.toBeDefined();
    await expect(getFacultyQuizAttemptDrilldown(facultyOnly,{quizId:quiz.id,...search,collegeId:SEED_IDS.collegeB})).rejects.toBeDefined();
  });
  it("persists IST Faculty schedule inputs and reschedules with microsecond-safe tokens",async()=>{
    const {delivery}=await fixture();
    const payload={action:"CREATE" as const,title:"Own Faculty IST session "+runId,
      description:null,location:null,confirm:true as const,
      ...facultyScheduleInstants(futureIstDay+"T00:15",futureIstDay+"T01:15")};
    const created=await commandFacultyAttendanceSchedule(facultyOnly,{deliveryId:delivery.id},payload);
    const persisted=await pool.query<{starts_at:Date,ends_at:Date}>(
      "select starts_at,ends_at from section_schedule_events where id=$1",[created.id]);
    expect(persisted.rows[0]?.starts_at.toISOString()).toBe(futureIstPreviousDay+"T18:45:00.000Z");
    expect(persisted.rows[0]?.ends_at.toISOString()).toBe(futureIstPreviousDay+"T19:45:00.000Z");
    await expect(commandFacultyAttendanceSchedule(learner,{deliveryId:delivery.id},payload)).rejects.toBeDefined();
    await expect(commandFacultyAttendanceSchedule(facultyOnly,{deliveryId:SEED_IDS.collegeB},payload)).rejects.toBeDefined();
    const version=await pool.query<{updated_at:Date}>(
      "update section_schedule_events set updated_at=now() where id=$1 returning updated_at",[created.id]);
    const change={...payload,action:"RESCHEDULE" as const,sessionId:created.id,
      expectedUpdatedAt:version.rows[0]!.updated_at.toISOString(),
      ...facultyScheduleInstants(futureIstDay+"T02:15",futureIstDay+"T03:15")};
    const saved=await commandFacultyAttendanceSchedule(facultyOnly,{deliveryId:delivery.id},change);
    expect(saved.updatedAt.getTime()).toBeGreaterThan(version.rows[0]!.updated_at.getTime());
    await expect(commandFacultyAttendanceSchedule(facultyOnly,{deliveryId:delivery.id},change))
      .rejects.toMatchObject({code:"FACULTY_ATTENDANCE_SCHEDULE_STALE_VERSION"});
    await expect(commandFacultyAttendanceSchedule(facultyOnly,{deliveryId:delivery.id},{
      ...change,expectedUpdatedAt:saved.updatedAt.toISOString(),
    })).rejects.toMatchObject({code:"FACULTY_ATTENDANCE_SCHEDULE_NO_CHANGE"});
    const afterNoOp=await pool.query<{updated_at:Date}>("select updated_at from section_schedule_events where id=$1",[created.id]);
    expect(afterNoOp.rows[0]?.updated_at.getTime()).toBe(saved.updatedAt.getTime());
    const audits=await pool.query<{count:number}>(
      "select count(*)::int as count from activity_events where subject_id=$1::text and summary like 'Faculty attendance session%'",[created.id]);
    expect(audits.rows[0]?.count).toBe(2);
  });
  it("corrects an exact Section session with SQL microsecond markedAt and rejects stale/foreign/learner",async()=>{
    const {delivery,section}=await fixture();
    const end=new Date(Date.now()-10*60000);
    const start=new Date(end.getTime()-30*60000);
    const session=await createSectionScheduleEvent(admin,{
      sectionId:section.id,deliveryId:delivery.id,
      title:"Correction fixture "+runId,startsAt:start.toISOString(),endsAt:end.toISOString(),
    });
    // Prepare the first immutable ABSENT mark through the production writer.
    // Then advance the session token using SQL microseconds to preserve this
    // test's non-millisecond CAS regression.
    await markFacultyAttendance(facultyOnly,session.id,{
      deliveryId:delivery.id,absentMembershipIds:[testLearnerMembershipId],
      presentMembershipIds:[],
    });
    const inserted=await pool.query<{marked_at:Date}>(`
      update attendance_sessions set marked_at=clock_timestamp(),
        updated_at=clock_timestamp()
      where schedule_event_id=$1 returning marked_at`,[session.id]);
    const request={deliveryId:delivery.id,presentMembershipIds:[testLearnerMembershipId],
      absentMembershipIds:[],expectedMarkedAt:inserted.rows[0]!.marked_at.toISOString(),
      correctionReason:"Corrected marked presence per official register"};
    await expect(markFacultyAttendance(learner,session.id,request)).rejects.toBeDefined();
    await expect(markFacultyAttendance(facultyOnly,SEED_IDS.collegeB,request)).rejects.toBeDefined();
    await expect(markFacultyAttendance({
      ...facultyOnly,membership:{...facultyOnly.membership!,collegeId:SEED_IDS.collegeB},
    },session.id,request)).rejects.toBeDefined();
    const prior=await pool.query<{membership_id:string}>(
      "select membership_id from attendance_records where schedule_event_id=$1 and status='ABSENT'",[session.id]);
    const preview=facultyAttendanceConfirmation(true,prior.rows.map(row=>row.membership_id),[],1);
    expect(preview).toContain("0 changed to absent, 1 changed to present");
    expect(preview).not.toContain(testLearnerMembershipId);
    const corrected=await markFacultyAttendance(facultyOnly,session.id,request);
    expect(corrected.markedPresent).toBe(1);
    expect(facultyAttendanceConfirmation(true,[],[],1)).toBeNull();
    await expect(markFacultyAttendance(facultyOnly,session.id,request))
      .rejects.toMatchObject({code:"ATTENDANCE_STALE_VERSION"});
    const audit=await pool.query<{metadata:{correction:boolean,markedAt:string}}>(`
      select metadata from activity_events
      where subject_id=$1::text and event_type='courses.attendance.marked'
      order by occurred_at desc limit 1`,[session.id]);
    expect(audit.rows[0]?.metadata.correction).toBe(true);
    const reason=await pool.query<{metadata:{correctionReason:string}}>(`
      select metadata from activity_events
      where subject_id=$1::text and event_type='courses.attendance.marked'
      order by occurred_at desc limit 1`,[session.id]);
    expect(reason.rows[0]?.metadata.correctionReason).toMatch(/official register/);
    expect(audit.rows[0]?.metadata.markedAt).toBe(corrected.markedAt.toISOString());
  });
  it("scopes the old Quiz results endpoint to the owning Section Faculty and Admin, with audit",async()=>{
    const {delivery,quiz}=await fixture();
    // A still-open PUBLISHED quiz must not reveal answers before its due time.
    // Closing a quiz ends attempts and independently permits results release;
    // the legacy results API deliberately treats CLOSED as release-ready.
    await expect(setCourseQuizResults(admin,quiz.id,{published:true}))
      .rejects.toMatchObject({code:"INVALID_QUIZ_TRANSITION"});
    await transitionCourseQuiz(faculty,quiz.id,{...await facultyAssessmentFixtureToken(pool,"QUIZ",quiz.id), action:"CLOSE"});
    await pool.query("update course_quizzes set due_at=now()-interval '1 hour' where id=$1",[quiz.id]);
    await expect(setCourseQuizResults(learner,quiz.id,{published:true}))
      .rejects.toBeDefined();
    await expect(setCourseQuizResults({
      ...admin,membership:{...admin.membership!,collegeId:SEED_IDS.collegeB},
    },quiz.id,{published:true})).rejects.toBeDefined();
    // 3a75ee19f6 restored legacy parity: the Faculty who teaches the quiz's
    // own Section delivery may release its results (shared quizzes stay Admin-only).
    const published=await setCourseQuizResults(facultyOnly,quiz.id,{published:true});
    expect(published.resultsPublished).toBe(true);
    await expect(setCourseQuizResults(admin,quiz.id,{published:true}))
      .rejects.toMatchObject({code:"INVALID_QUIZ_TRANSITION"});
    const hidden=await setCourseQuizResults(admin,quiz.id,{published:false});
    expect(hidden.resultsPublished).toBe(false);
    const audits=await pool.query<{n:string}>(`
      select count(*)::text as n from activity_events
      where subject_id=$1::text and event_type='courses.quiz.results_changed'`,[quiz.id]);
    expect(audits.rows[0]?.n).toBe("2");
    const visible=await pool.query<{results_published:boolean}>(
      "select results_published from course_quizzes where id=$1",[quiz.id]);
    expect(visible.rows[0]!.results_published).toBe(false);
    expect(delivery.id).toBeTruthy();
  });
  it("toggles CLOSED Quiz result visibility with an audited SQL-default token",async()=>{
   const {delivery,quiz}=await fixture();
   const closed=await transitionCourseQuiz(faculty,quiz.id,{...await facultyAssessmentFixtureToken(pool,"QUIZ",quiz.id), action:"CLOSE"});
   const row=await pool.query<{updated_at:Date}>(
    "update course_quizzes set updated_at=now() where id=$1 returning updated_at",[closed.id]);
   const token={deliveryId:delivery.id,action:"PUBLISH" as const,
    expectedUpdatedAt:row.rows[0]!.updated_at.toISOString(),confirmed:true as const};
   await expect(commandFacultyQuizResults(learner,quiz.id,token)).rejects.toBeDefined();
   await expect(commandFacultyQuizResults({
    ...facultyOnly,membership:{...facultyOnly.membership!,collegeId:SEED_IDS.collegeB},
   },quiz.id,token)).rejects.toBeDefined();
   await expect(commandFacultyQuizResults(facultyOnly,quiz.id,{
    ...token,deliveryId:SEED_IDS.collegeB,
   })).rejects.toBeDefined();
   await expect(commandFacultyQuizResults(facultyOnly,quiz.id,{
    ...token,expectedUpdatedAt:"2026-01-01T00:00:00.000Z",
   })).rejects.toMatchObject({code:"QUIZ_RESULTS_STALE_VERSION"});
   const published=await commandFacultyQuizResults(facultyOnly,quiz.id,token);
   expect(published.resultsPublished).toBe(true);
   await expect(commandFacultyQuizResults(facultyOnly,quiz.id,token)).rejects.toBeDefined();
   const hidden=await commandFacultyQuizResults(facultyOnly,quiz.id,{
    ...token,action:"HIDE",expectedUpdatedAt:published.updatedAt.toISOString(),
   });
   expect(hidden.resultsPublished).toBe(false);
   const events=await pool.query<{n:string}>(`
    select count(*)::text as n from activity_events where subject_id=$1::text
     and event_type='courses.quiz.results_changed'`,[quiz.id]);
   expect(events.rows[0]?.n).toBe("2");
  });
  it("denies a no-op and an unexplained existing-session correction",async()=>{
    const {delivery,section}=await fixture();
    const end=new Date(Date.now()-12*60000),start=new Date(end.getTime()-30*60000);
    const event=await createSectionScheduleEvent(admin,{
      sectionId:section.id,deliveryId:delivery.id,title:"Explain corrections "+runId,
      startsAt:start.toISOString(),endsAt:end.toISOString(),
    });
    const [record]= (await pool.query<{marked_at:Date}>(`insert into attendance_sessions
      (schedule_event_id,status,marked_by_user_id,marked_at,updated_at)
      values($1,'MARKED',$2,now(),now()) returning marked_at`,
      [event.id,facultyOnlyUserId])).rows;
    const body={deliveryId:delivery.id,presentMembershipIds:[testLearnerMembershipId],
      absentMembershipIds:[],expectedMarkedAt:record!.marked_at.toISOString()};
    await expect(markFacultyAttendance(facultyOnly,event.id,body))
      .rejects.toMatchObject({code:"ATTENDANCE_CORRECTION_REASON_REQUIRED"});
    await expect(markFacultyAttendance(facultyOnly,event.id,{
      ...body,correctionReason:"Checked register; no learner state changed",
    })).rejects.toMatchObject({code:"ATTENDANCE_CORRECTION_NO_CHANGE"});
  });
  it("filters Quiz CSV by actual attempted state without leaking another Section",async()=>{
    const {delivery,quiz}=await fixture();
    const none=await getFacultyReportCsvForDownload(facultyOnly,{
      kind:"quiz",assessmentId:quiz.id,deliveryId:delivery.id,filter:"ATTEMPTED",
    });
    expect(none.csv).not.toContain('"NOT_ATTEMPTED"');
    const unattempted=await getFacultyReportCsvForDownload(facultyOnly,{
      kind:"quiz",assessmentId:quiz.id,deliveryId:delivery.id,filter:"NOT_ATTEMPTED",
    });
    expect(unattempted.csv).toContain("NOT_ATTEMPTED");
    expect(unattempted.csv).not.toContain('"Email"');
    await expect(getFacultyReportCsvForDownload(learner,{
      kind:"quiz",assessmentId:quiz.id,deliveryId:delivery.id,filter:"ATTEMPTED",
    })).rejects.toBeDefined();
    await expect(getFacultyReportCsvForDownload(facultyOnly,{
      kind:"quiz",assessmentId:quiz.id,deliveryId:SEED_IDS.collegeB,filter:"ATTEMPTED",
    })).rejects.toBeDefined();
    await expect(getFacultyReportCsvForDownload(facultyOnly,{
      kind:"quiz",assessmentId:quiz.id,deliveryId:delivery.id,filter:"LATE",
    })).rejects.toBeDefined();
  });
  it("exports only scoped Faculty Section rows without learner contact fields",async()=>{
    const {delivery,assignment,quiz}=await fixture();
    const row=await pool.query<{id:string}>(`insert into assignment_submissions
      (assignment_id,delivery_id,membership_id,submission_type,text_content)
      values($1,$2,$3,'TEXT','Learner response') returning id`,
      [assignment.id,delivery.id,testLearnerMembershipId]);
    expect(row.rows[0]?.id).toBeTruthy();
    // Contact must not escape via the name fallback when the real name is missing.
    await pool.query("update users set display_name=null where id=$1", [testLearnerUserId]);
    const exported=await getFacultyReportCsvForDownload(facultyOnly,{
      kind:"assignment",assessmentId:assignment.id,deliveryId:delivery.id});
    expect(exported.csv).toContain("Submitted at (IST)");
    expect(exported.csv).toContain("Learner (name unavailable)");
    expect(exported.csv).not.toContain('"Email"');
    const identity=await pool.query<{email:string}>("select email from users where id=$1",
      [testLearnerUserId]);
    expect(exported.csv).not.toContain(identity.rows[0]!.email);
    const quizCsv=await getFacultyReportCsvForDownload(facultyOnly,{
      kind:"quiz",assessmentId:quiz.id,deliveryId:delivery.id});
    expect(quizCsv.csv).not.toContain(identity.rows[0]!.email);
    expect(quizCsv.csv).toContain("Learner (name unavailable)");
    await expect(getFacultyReportCsvForDownload(learner,{
      kind:"assignment",assessmentId:assignment.id,deliveryId:delivery.id,
    })).rejects.toBeDefined();
    await expect(getFacultyReportCsvForDownload({
      ...facultyOnly,membership:{...facultyOnly.membership!,collegeId:SEED_IDS.collegeB},
    },{kind:"assignment",assessmentId:assignment.id,deliveryId:delivery.id}))
      .rejects.toBeDefined();
    await expect(getFacultyReportCsvForDownload(facultyOnly,{
      kind:"assignment",assessmentId:assignment.id,deliveryId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
  it("reads registered Section discussion participation without cross-Section disclosure",async()=>{
    const {delivery}=await fixture();
    await pool.query(`insert into course_discussion_messages(delivery_id,sender_membership_id,
      sender_role,message_text) values($1,$2,'FACULTY',$3)`,
      [delivery.id,facultyOnlyMembershipId,"Visible to Section only"]);
    const data=await getFacultyDiscussionParticipation(facultyOnly,{deliveryId:delivery.id});
    expect(data.counts).toMatchObject({total:1,faculty:1,learner:0,pinned:0});
    expect(data.recent).toHaveLength(1);
    await expect(getFacultyDiscussionParticipation(learner,{deliveryId:delivery.id}))
      .rejects.toBeDefined();
    await expect(getFacultyDiscussionParticipation(facultyOnly,{deliveryId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
    await expect(getFacultyDiscussionParticipation(facultyOnly,{
      deliveryId:delivery.id,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
  it("reads registered Section attendance session coverage with honest unmarked state",async()=>{
    const {delivery,section}=await fixture();
    await createSectionScheduleEvent(admin,{
      sectionId:section.id,deliveryId:delivery.id,
      title:"C4 coverage session "+runId,
      startsAt:"2026-10-20T04:00:00.000Z",endsAt:"2026-10-20T05:00:00.000Z",
    });
    const summary=await getFacultySessionCoverage(facultyOnly,{deliveryId:delivery.id});
    expect(summary.total).toBe(1);
    expect(summary.marked).toBe(0);
    expect(summary.shown[0]).toMatchObject({title:"C4 coverage session "+runId});
    await expect(getFacultySessionCoverage(learner,{deliveryId:delivery.id}))
      .rejects.toBeDefined();
    await expect(getFacultySessionCoverage(facultyOnly,{deliveryId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
    await expect(getFacultySessionCoverage(facultyOnly,{
      deliveryId:delivery.id,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
  it("reads live self-profile Section, IST sessions and registered learner contact",async()=>{
    const {delivery,section}=await fixture();
    const session=await createSectionScheduleEvent(admin,{
      sectionId:section.id,deliveryId:delivery.id,
      title:"Chat4 IST midnight Session "+runId,
      startsAt:"2026-10-13T18:15:00.000Z",
      endsAt:"2026-10-13T19:00:00.000Z",
    });
    const month=await getFacultyIstMonth(facultyOnly,{
      month:"2026-10",deliveryId:delivery.id,
    });
    expect(month.grid.days.find(day=>day.key==="2026-10-13")?.events)
      .toEqual(expect.arrayContaining([expect.objectContaining({id:session.id})]));
    expect(month.grid.days.find(day=>day.key==="2026-10-14")?.events)
      .toEqual(expect.arrayContaining([expect.objectContaining({id:session.id})]));
    await expect(getFacultyIstMonth(facultyOnly,{
      month:"2026-10",deliveryId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    await expect(getFacultyIstMonth(learner,{month:"2026-10"}))
      .rejects.toBeDefined();
    // The seeded College A actor is FACULTY + MENTOR, intentionally rejected
    // from the Faculty-only self-profile. Exercise the success path with a
    // separately persisted, active FACULTY-only user in the SAME college.
    await expect(getOwnFacultyTeachingSection(faculty,{}))
      .rejects.toThrow(/profile\.self\.manage/);
    const notices=await getFacultySectionNotices(facultyOnly,{deliveryId:delivery.id});
    expect(notices.available).toBe(false);
    expect(notices.items).toEqual([]);
    expect(notices.blocker).toContain("not yet promoted");
    await expect(getFacultySectionNotices(learner,{deliveryId:delivery.id})).rejects.toBeDefined();
    await expect(getFacultySectionNotices(facultyOnly,{deliveryId:SEED_IDS.collegeB})).rejects.toBeDefined();
    await expect(getFacultySectionNotices(facultyOnly,{
      deliveryId:delivery.id,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    const teaching=await getOwnFacultyTeachingSection(facultyOnly,{});
    expect(teaching.items).toEqual(expect.arrayContaining([
      expect.objectContaining({deliveryId:delivery.id,courseCode:codePrefix+"-ALG"}),
    ]));
    const contact=await getFacultyContactDetail(facultyOnly,{
      contactsTab:"students",membershipId:SEED_IDS.learnerCollegeAMembership,
    });
    expect(contact.membershipId).toBe(SEED_IDS.learnerCollegeAMembership);
    expect(contact.roles).toContain("LEARNER");
    await expect(getFacultyContactDetail(learner,{
      contactsTab:"students",membershipId:SEED_IDS.learnerCollegeAMembership,
    })).rejects.toBeDefined();
  });

  it("renders real published Section health and regenerates safe server-owned CSV",async()=>{
    const {delivery,assignment,quiz}=await fixture();
    const health=await getFacultyCourseAssessmentHealth(faculty,{
      deliveryId:delivery.id,kind:"ALL",page:1,
    });
    const correction=await getFacultyCorrectionAvailability(faculty,{
      deliveryId:delivery.id,
    });
    expect(correction.requestsAvailable).toBe(false);
    expect(correction.requestHistory).toBeNull();
    expect(correction.items).toEqual([]);
    await expect(getFacultyCorrectionAvailability(learner,{
      deliveryId:delivery.id,
    })).rejects.toBeDefined();
    await expect(getFacultyCorrectionAvailability(faculty,{
      deliveryId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    await expect(getFacultyCorrectionAvailability(faculty,{
      deliveryId:delivery.id,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    const gradebook=await getFacultyPublishedGradebook(faculty,{deliveryId:delivery.id});
    expect(gradebook.rosterSize).toBe(1);
    expect(gradebook.rows).toEqual(expect.arrayContaining([
      expect.objectContaining({membershipId:testLearnerMembershipId,
        gradedCount:0,earned:null,possible:null,percent:null,hasUnknown:true}),
    ]));
    expect(facultyGradebookCsv(gradebook.rows)).toContain('"Incomplete grading"');
    const learnerBreakdown=await getFacultyPublishedGradebookLearner(facultyOnly,{
      deliveryId:delivery.id,learnerMembershipId:testLearnerMembershipId,
    });
    expect(learnerBreakdown.learner).toMatchObject({
      membershipId:testLearnerMembershipId,earned:null,percent:null,
    });
    expect(learnerBreakdown.assessments.length).toBeGreaterThan(0);
    expect(learnerBreakdown.assessments.every(row=>row.status==="UNKNOWN")).toBe(true);
    await expect(getFacultyPublishedGradebookLearner({
      user:{...learner.user,id:testLearnerUserId},
      membership:{...learner.membership!,id:testLearnerMembershipId},
    },{
      deliveryId:delivery.id,learnerMembershipId:testLearnerMembershipId,
    })).rejects.toBeDefined();
    await expect(getFacultyPublishedGradebookLearner(facultyOnly,{
      deliveryId:SEED_IDS.collegeB,learnerMembershipId:testLearnerMembershipId,
    })).rejects.toBeDefined();
    await expect(getFacultyPublishedGradebookLearner(facultyOnly,{
      deliveryId:delivery.id,learnerMembershipId:SEED_IDS.collegeB,
    })).rejects.toMatchObject({code:"MEMBERSHIP_NOT_FOUND"});
    await expect(getFacultyPublishedGradebookLearner(facultyOnly,{
      deliveryId:delivery.id,learnerMembershipId:testLearnerMembershipId,
      collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    await expect(getFacultyPublishedGradebook(learner,{deliveryId:delivery.id}))
      .rejects.toBeDefined();
    await expect(getFacultyPublishedGradebook(faculty,{deliveryId:SEED_IDS.collegeB}))
      .rejects.toBeDefined();
    await expect(getFacultyPublishedGradebook(faculty,{
      deliveryId:delivery.id,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    expect(health.rosterSize).toBe(1);
    const results=await getFacultyAssessmentResults(faculty,{});
    expect(results.items).toEqual(expect.arrayContaining([
      expect.objectContaining({id:assignment.id,kind:"ASSIGNMENT",eligible:1,responded:0}),
      expect.objectContaining({id:quiz.id,kind:"QUIZ",eligible:1,responded:0}),
    ]));
    const dueFollowUps=await getFacultyResponseFollowUps(faculty,{});
    expect(dueFollowUps.items).toEqual([]);
    expect(dueFollowUps.total).toBe(0);
    expect(health.items).toEqual(expect.arrayContaining([
      expect.objectContaining({id:assignment.id,kind:"ASSIGNMENT",
        eligible:1,responded:0,outstanding:1,coveragePercent:0}),
      expect.objectContaining({id:quiz.id,kind:"QUIZ",
        eligible:1,responded:0,outstanding:1,coveragePercent:0}),
    ]));

    const csvAssignment=await getFacultyReportCsvForDownload(faculty,{
      kind:"assignment",assessmentId:assignment.id,deliveryId:delivery.id,
    });
    expect(csvAssignment.filename).toMatch(/^faculty-assignment-report-.*\.csv$/);
    expect(csvAssignment.csv).toContain('"NOT_SUBMITTED"');
    expect(csvAssignment.csv).not.toContain('"SUBMITTED"');
    const gradedCsv=await getFacultyReportCsvForDownload(faculty,{
      kind:"assignment",assessmentId:assignment.id,deliveryId:delivery.id,
      filter:"GRADED",
    });
    // Orchestrator default 1 (2026-10-14): list CSV exports never carry contact details for Faculty.
    expect(gradedCsv.csv).toContain('"Learner","Response"');
    expect(gradedCsv.csv).not.toContain('"Email"');
    expect(gradedCsv.csv).not.toContain('"NOT_SUBMITTED"');
    await expect(getFacultyReportCsvForDownload(faculty,{
      kind:"quiz",assessmentId:quiz.id,deliveryId:delivery.id,filter:"LATE",
    })).rejects.toBeDefined();
    const drill=await getFacultyQuizAttemptDrilldown(faculty,{
      quizId:quiz.id,deliveryId:delivery.id,page:1,
    });
    expect(drill.total).toBe(0);
    expect(drill.items).toEqual([]);
    expect(drill.questions).toHaveLength(1);
    await expect(getFacultyQuizAttemptDrilldown(learner,{
      quizId:quiz.id,deliveryId:delivery.id,
    })).rejects.toBeDefined();
    await expect(getFacultyQuizAttemptDrilldown(faculty,{
      quizId:quiz.id,deliveryId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    await expect(getFacultyQuizAttemptDrilldown(faculty,{
      quizId:quiz.id,deliveryId:delivery.id,collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    const csvQuiz=await getFacultyReportCsvForDownload(faculty,{
      kind:"quiz",assessmentId:quiz.id,deliveryId:delivery.id,
    });
    expect(csvQuiz.csv).toContain('"NOT_ATTEMPTED"');
    expect(csvQuiz.csv).not.toContain('"ATTEMPTED"');
    expect(csvQuiz.omittedRows).toBe(0);
    expect(csvQuiz.csv).not.toContain("NOTICE:");

    await expect(getFacultyReportCsvForDownload(learner,{
      kind:"assignment",assessmentId:assignment.id,deliveryId:delivery.id,
    })).rejects.toBeDefined();
    await expect(getFacultyReportCsvForDownload(faculty,{
      kind:"quiz",assessmentId:quiz.id,deliveryId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});


describe("Faculty active teaching membership cannot be forged by stale context", () => {
  it("rejects revoked Faculty role and suspended membership on reads and writes", async () => {
    const { delivery } = await fixture();
    const offeringId = delivery.offeringId;
    expect(await requireLearningReadAccess(facultyOnly, offeringId, delivery.id)).toBe("FACULTY");
    expect(await requireDeliveryContentMutation(facultyOnly, delivery.id)).toBe("FACULTY");
    await expect(requireLearningReadAccess(learner, offeringId, delivery.id)).rejects.toBeDefined();
    await expect(requireLearningReadAccess({ ...facultyOnly, membership: { ...facultyOnly.membership!, collegeId: SEED_IDS.collegeB } }, offeringId, delivery.id)).rejects.toBeDefined();
    await pool.query("delete from membership_roles where membership_id = $1::uuid and role = $2::membership_role", [facultyOnlyMembershipId, "FACULTY"]);
    try {
      await expect(requireLearningReadAccess(facultyOnly, offeringId, delivery.id)).rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
      await expect(requireDeliveryContentMutation(facultyOnly, delivery.id)).rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    } finally {
      await pool.query("insert into membership_roles (id,membership_id,role) values ($1::uuid,$2::uuid,$3::membership_role) on conflict (id) do nothing", [facultyOnlyRoleId, facultyOnlyMembershipId, "FACULTY"]);
    }
    await pool.query("update college_memberships set status = 'SUSPENDED' where id = $1::uuid", [facultyOnlyMembershipId]);
    try {
      await expect(requireLearningReadAccess(facultyOnly, offeringId, delivery.id)).rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
      await expect(requireDeliveryContentMutation(facultyOnly, delivery.id)).rejects.toMatchObject({ code: "FACULTY_TEACHING_SCOPE_REQUIRED" });
    } finally {
      await pool.query("update college_memberships set status = 'ACTIVE' where id = $1::uuid", [facultyOnlyMembershipId]);
    }
  });
});


describe("Faculty assignment command rejects stale membership state", () => {
  it("denies an optimistic Faculty context after its persisted role is revoked", async () => {
    const {delivery}=await fixture();
    await pool.query("delete from membership_roles where membership_id=$1::uuid and role=$2::membership_role", [facultyOnlyMembershipId,"FACULTY"]);
    try {
      await expect(commandFacultyAssignment(facultyOnly,{deliveryId:delivery.id},{
        action:"CREATE",lessonId:randomUUID(),sequence:1,title:"Denied",description:null,
        dueAt:null,maxPoints:10,confirmed:true,
      })).rejects.toMatchObject({code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
    } finally {
      await pool.query("insert into membership_roles (id,membership_id,role) values ($1::uuid,$2::uuid,$3::membership_role) on conflict (id) do nothing",
        [facultyOnlyRoleId,facultyOnlyMembershipId,"FACULTY"]);
    }
  });
});


describe("Faculty grade mutation scope checks", () => {
  it("rejects a forged Faculty context on a foreign membership", async () => {
    const {delivery,assignment}=await fixture();
    const rows=await listAssignmentSubmissions(facultyOnly,assignment.id,delivery.id);
    expect(rows.length).toBe(0);
    await expect(publishAssignmentGrade(learner,randomUUID(),{expectedVersion:0})).rejects.toBeDefined();
    await expect(gradeAssignmentSubmission({...facultyOnly,membership:{...facultyOnly.membership!,collegeId:SEED_IDS.collegeB}},randomUUID(),{
      pointsAwarded:2,feedback:"Revised",expectedVersion:0,
    })).rejects.toBeDefined();
  });
});


describe("Faculty attendance bounded by persisted active delivery", () => {
  it("rejects a delivered course that has ended after its teaching context was issued", async () => {
    const {delivery}=await fixture();
    expect((await getFacultyCourseList(facultyOnly,{q:"",period:"",role:"",page:1})).items.length).toBeGreaterThanOrEqual(1);
    // DB05 correctly blocks ending delivery while faculty assignments
    // remain active. End those assignments before the delivery.
    await expect(pool.query("update course_section_deliveries set ended_at=now() where id=$1::uuid",[delivery.id]))
      .rejects.toMatchObject({code:"23514"});
    await pool.query("update course_teaching_assignments set ended_at=now() where delivery_id=$1::uuid and ended_at is null",[delivery.id]);
    await pool.query("update course_section_deliveries set ended_at=now() where id=$1::uuid",[delivery.id]);
    await expect(getFacultySessionCoverage(facultyOnly,{deliveryId:delivery.id})).rejects.toBeDefined();
  });
});


describe("Faculty discussion moderation revoked role", () => {
  it("does not allow stale Faculty membership to pin or delete an earlier message", async () => {
    const {delivery}=await fixture();
    const posted=await createCourseDiscussionMessage(facultyOnly,delivery.id,{messageText:"Scoped note"});
    await pool.query("delete from membership_roles where membership_id=$1::uuid and role=$2::membership_role",[facultyOnlyMembershipId,"FACULTY"]);
    try {
      const token={expectedUpdatedAt:posted.updatedAt.toISOString(),confirmed:true};
      await expect(toggleCourseDiscussionPin(facultyOnly,posted.id,delivery.id,token)).rejects.toBeDefined();
      await expect(deleteCourseDiscussionMessage(facultyOnly,posted.id,delivery.id,token)).rejects.toBeDefined();
    } finally {
      await pool.query("insert into membership_roles(id,membership_id,role) values ($1::uuid,$2::uuid,$3::membership_role) on conflict(id) do nothing",[facultyOnlyRoleId,facultyOnlyMembershipId,"FACULTY"]);
    }
  });
});
