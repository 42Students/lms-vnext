import { afterAll, beforeEach, describe, expect, it } from "vitest";
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
import { createCourseAssignment, transitionCourseAssignment } from "@/modules/courses/assignment-service";
import {commandFacultyAssignment} from "@/modules/courses/faculty-assignment-authoring-service";
import {commandFacultyQuiz} from "@/modules/courses/faculty-quiz-authoring-service";
import { createCourseQuiz, transitionCourseQuiz } from "@/modules/courses/quiz-service";
import { getFacultyCourseAssessmentHealth } from "@/modules/courses/faculty-course-health-service";
import {getFacultyCorrectionAvailability} from "@/modules/attendance/faculty-correction-service";
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
import {createCourseDiscussionMessage,toggleCourseDiscussionPin,deleteCourseDiscussionMessage}
 from "@/modules/courses/discussion-service";
import { createSectionScheduleEvent } from "@/modules/academics/schedule-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

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
  await pool.query("delete from programs where code like $1", [codePattern]);
  await pool.query("delete from academic_periods where code like $1", [codePattern]);
  // Only the principal created by THIS suite: do not mutate deterministic seed users.
  await pool.query("delete from faculty_profiles where membership_id = $1", [facultyOnlyMembershipId]);
  await pool.query("delete from learner_profiles where membership_id = $1", [testLearnerMembershipId]);
  await pool.query("delete from membership_roles where membership_id = $1", [testLearnerMembershipId]);
  await pool.query("delete from college_memberships where id = $1", [testLearnerMembershipId]);
  await pool.query("delete from users where id = $1", [testLearnerUserId]);
  await pool.query("delete from membership_roles where membership_id = $1", [facultyOnlyMembershipId]);
  await pool.query("delete from college_memberships where id = $1", [facultyOnlyMembershipId]);
  await pool.query("delete from users where id = $1", [facultyOnlyUserId]);
}
async function fixture() {
  const program=await createProgram(admin,{
    departmentId:SEED_IDS.departmentA,name:"Chat4 Positive CS " + runId,code:codePrefix+"-PROGRAM",durationTerms:8,
  });
  const period=await createAcademicPeriod(admin,{
    collegeId:SEED_IDS.collegeA,name:"Chat4 Positive Semester " + runId,
    code:codePrefix+"-PERIOD",startDate:"2026-07-01",endDate:"2027-12-31",
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
    lessonId:lesson.id,deliveryId:delivery.id,title:"Chat4 Assignment " + runId,maxPoints:10,sequence:0,
  });
  const quiz=await createCourseQuiz(faculty,{
    lessonId:lesson.id,deliveryId:delivery.id,title:"Chat4 Quiz " + runId,maxAttempts:2,sequence:1,
    questions:[{
      type:"SINGLE_CHOICE",prompt:"Which is FIFO?",points:5,sequence:0,
      options:[{text:"Queue",correct:true,sequence:0},{text:"Stack",correct:false,sequence:1}],
    }],
  });
  await transitionCourseAssignment(faculty,assignment.id,{action:"PUBLISH"});
  await transitionCourseQuiz(faculty,quiz.id,{action:"PUBLISH"});
  return {delivery,section,assignment,quiz};
}
async function seedFacultyOnly() {
  // The seeded learner already belongs to a programme. DB02 explicitly
  // forbids a second active programme enrolment per membership; use a fresh
  // active learner principal so positive-path tests reflect production rules.
  await pool.query(
    "insert into users (id, identity_uid, email, display_name, platform_status) values ($1, $2, $3, $4, 'ACTIVE')",
    [testLearnerUserId, "c4pos-learner-" + runId,
      "c4pos-learner-" + runId.toLowerCase() + "@example.invalid",
      "Chat4 Learner " + runId],
  );
  await pool.query(
    "insert into college_memberships (id, user_id, college_id, status) values ($1, $2, $3, 'ACTIVE')",
    [testLearnerMembershipId, testLearnerUserId, SEED_IDS.collegeA],
  );
  await pool.query(
    "insert into membership_roles (id, membership_id, role) values ($1, $2, 'LEARNER')",
    [testLearnerRoleId, testLearnerMembershipId],
  );
  await pool.query(
    "insert into users (id, identity_uid, email, display_name, platform_status) values ($1, $2, $3, $4, 'ACTIVE')",
    [facultyOnlyUserId, facultyOnly.user.identityUid,
      "c4pos-faculty-" + runId.toLowerCase() + "@example.invalid",
      "Chat4 Faculty " + runId],
  );
  await pool.query(
    "insert into college_memberships (id, user_id, college_id, status) values ($1, $2, $3, 'ACTIVE')",
    [facultyOnlyMembershipId, facultyOnlyUserId, SEED_IDS.collegeA],
  );
  await pool.query(
    "insert into membership_roles (id, membership_id, role) values ($1, $2, 'FACULTY')",
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
      title:"Faculty quiz "+runId,description:null,dueAt:null,maxAttempts:2,
      questions,confirmed:true,
    });
    const revised=await commandFacultyQuiz(facultyOnly,{deliveryId:delivery.id},{
      action:"EDIT",quizId:draft.id,expectedUpdatedAt:draft.updatedAt.toISOString(),
      title:"Revised quiz "+runId,description:null,dueAt:null,maxAttempts:2,
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
    const published=await commandFacultyQuiz(facultyOnly,{deliveryId:delivery.id},{
      action:"PUBLISH",quizId:draft.id,
      expectedUpdatedAt:revised.updatedAt.toISOString(),confirmed:true,
    });
    expect(published.status).toBe("PUBLISHED");
    const events=await pool.query<{event_type:string}>(`
      select event_type from activity_events where subject_id=$1::text
      and event_type like 'courses.quiz.%'`,[draft.id]);
    expect(events.rows.map(row=>row.event_type).sort()).toEqual([
      "courses.quiz.created","courses.quiz.published","courses.quiz.updated",
    ]);
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
      description:"Text only",dueAt:null,maxPoints:15,confirmed:true,
    });
    expect(created.status).toBe("DRAFT");
    const edited=await commandFacultyAssignment(facultyOnly,{deliveryId:delivery.id},{
      action:"EDIT",assignmentId:created.id,expectedUpdatedAt:created.updatedAt.toISOString(),
      title:"Revised draft "+runId,description:"Updated text",dueAt:null,maxPoints:20,
      confirmed:true,
    });
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
    const events=await pool.query<{event_type:string}>(`
      select event_type from activity_events where subject_id=$1::text
      and event_type in ('courses.assignment.created','courses.assignment.updated')`,[created.id]);
    expect(events.rows.map(x=>x.event_type).sort()).toEqual([
      "courses.assignment.created","courses.assignment.updated",
    ]);
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
    expect(gradedCsv.csv).toContain('"Learner","Email"');
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
