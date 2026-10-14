import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
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
import { createCourseQuiz, transitionCourseQuiz } from "@/modules/courses/quiz-service";
import { getFacultyCourseAssessmentHealth } from "@/modules/courses/faculty-course-health-service";
import { getFacultyAssessmentResults } from "@/modules/courses/faculty-results-service";
import { getFacultyResponseFollowUps } from "@/modules/courses/faculty-response-followup-service";
import { getFacultyReportCsvForDownload } from "@/modules/courses/faculty-report-csv-service";
import { getOwnFacultyTeachingSection } from "@/modules/courses/faculty-profile-teaching-service";
import { getFacultyContactDetail } from "@/modules/courses/faculty-contacts-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Requires disposable PostgreSQL TEST_DATABASE_URL (never production DATABASE_URL)");
}
const pool = new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
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
  await pool.query(`delete from in_app_notifications where event_id in
    (select ev.id from activity_events ev where ev.subject_id in
      (select a.id::text from course_assignments a join course_lessons l on l.id=a.lesson_id
        join course_learning_paths lp on lp.id=l.learning_path_id
        join course_offerings co on co.id=lp.offering_id
        join courses c on c.id=co.course_id where c.code like 'C4POS-%'))`);
  await pool.query(`delete from activity_events where subject_id in
    (select a.id::text from course_assignments a join course_lessons l on l.id=a.lesson_id
      join course_learning_paths lp on lp.id=l.learning_path_id
      join course_offerings co on co.id=lp.offering_id
      join courses c on c.id=co.course_id where c.code like 'C4POS-%')`);
  await pool.query(`delete from quiz_options where question_id in (
    select question.id from quiz_questions question join course_quizzes quiz on quiz.id=question.quiz_id
    join course_lessons l on l.id=quiz.lesson_id join course_learning_paths lp on lp.id=l.learning_path_id
    join course_offerings co on co.id=lp.offering_id join courses c on c.id=co.course_id
    where c.code like 'C4POS-%')`);
  await pool.query(`delete from quiz_questions where quiz_id in (
    select quiz.id from course_quizzes quiz join course_lessons l on l.id=quiz.lesson_id
    join course_learning_paths lp on lp.id=l.learning_path_id
    join course_offerings co on co.id=lp.offering_id join courses c on c.id=co.course_id
    where c.code like 'C4POS-%')`);
  for(const table of ["course_quizzes","course_assignments"]) {
    await pool.query(`delete from ${table} where lesson_id in (
      select l.id from course_lessons l join course_learning_paths lp on lp.id=l.learning_path_id
      join course_offerings co on co.id=lp.offering_id join courses c on c.id=co.course_id
      where c.code like 'C4POS-%')`);
  }
  await pool.query(`delete from course_lessons where learning_path_id in (
    select lp.id from course_learning_paths lp join course_offerings co on co.id=lp.offering_id
    join courses c on c.id=co.course_id where c.code like 'C4POS-%')`);
  await pool.query(`delete from course_learning_paths where offering_id in (
    select co.id from course_offerings co join courses c on c.id=co.course_id
    where c.code like 'C4POS-%')`);
  await pool.query(`delete from course_teaching_assignments where delivery_id in (
    select d.id from course_section_deliveries d join course_offerings co on co.id=d.offering_id
    join courses c on c.id=co.course_id where c.code like 'C4POS-%')`);
  await pool.query(`delete from course_section_deliveries where offering_id in (
    select co.id from course_offerings co join courses c on c.id=co.course_id
    where c.code like 'C4POS-%')`);
  await pool.query(`delete from course_offerings where course_id in (
    select id from courses where code like 'C4POS-%')`);
  await pool.query("delete from courses where code like 'C4POS-%'");
  await pool.query(`delete from section_enrollments where learner_enrollment_id in (
    select e.id from learner_program_enrollments e
    join programs p on p.id=e.program_id where p.code like 'C4POS-%')`);
  await pool.query(`delete from learner_program_enrollments where program_id in (
    select id from programs where code like 'C4POS-%')`);
  await pool.query(`delete from sections where cohort_id in (
    select c.id from cohorts c join programs p on p.id=c.program_id where p.code like 'C4POS-%')`);
  await pool.query(`delete from cohorts where program_id in (
    select id from programs where code like 'C4POS-%')`);
  await pool.query("delete from programs where code like 'C4POS-%'");
  await pool.query("delete from academic_periods where code like 'C4POS-%'");
}
async function fixture() {
  const program=await createProgram(admin,{
    departmentId:SEED_IDS.departmentA,name:"Chat4 Positive CS",code:"C4POS-PROGRAM",durationTerms:8,
  });
  const period=await createAcademicPeriod(admin,{
    collegeId:SEED_IDS.collegeA,name:"Chat4 Positive Semester",
    code:"C4POS-PERIOD",startDate:"2026-07-01",endDate:"2027-12-31",
  });
  const cohort=await createCohort(admin,{
    programId:program.id,name:"Chat4 Intake",code:"C4POS-COHORT",startPeriodId:period.id,
  });
  const section=await createSection(admin,{
    cohortId:cohort.id,academicPeriodId:period.id,name:"Chat4 Section A",code:"C4POS-A",
  });
  const course=await createCourse(admin,{
    departmentId:SEED_IDS.departmentA,name:"Chat4 Algorithms",code:"C4POS-ALG",
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
  const enrollment=await createLearnerProgramEnrollment(admin,{
    membershipId:SEED_IDS.learnerCollegeAMembership,programId:program.id,cohortId:cohort.id,
  });
  await assignLearnerToSection(admin,{
    learnerEnrollmentId:enrollment.id,sectionId:section.id,
  });
  const path=await createLearningPath(admin,{
    offeringId:offering.id,title:"Chat4 Learning Path",
  });
  const lesson=await createCourseLesson(admin,{
    learningPathId:path.id,name:"Chat4 Fundamentals",sequence:0,
  });
  await transitionLearningPath(admin,path.id,{action:"PUBLISH"});
  const assignment=await createCourseAssignment(faculty,{
    lessonId:lesson.id,deliveryId:delivery.id,title:"Chat4 Assignment",maxPoints:10,sequence:0,
  });
  const quiz=await createCourseQuiz(faculty,{
    lessonId:lesson.id,deliveryId:delivery.id,title:"Chat4 Quiz",maxAttempts:2,sequence:1,
    questions:[{
      type:"SINGLE_CHOICE",prompt:"Which is FIFO?",points:5,sequence:0,
      options:[{text:"Queue",correct:true,sequence:0},{text:"Stack",correct:false,sequence:1}],
    }],
  });
  await transitionCourseAssignment(faculty,assignment.id,{action:"PUBLISH"});
  await transitionCourseQuiz(faculty,quiz.id,{action:"PUBLISH"});
  return {delivery,assignment,quiz};
}
beforeEach(cleanup);
afterAll(async()=>{
  try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}
});

describe("Chat4 Faculty SUCCESS paths against disposable PostgreSQL",()=>{
  it("reads live self-profile Section and registered learner contact",async()=>{
    const {delivery}=await fixture();
    const teaching=await getOwnFacultyTeachingSection(faculty,{});
    expect(teaching.items).toEqual(expect.arrayContaining([
      expect.objectContaining({deliveryId:delivery.id,courseCode:"C4POS-ALG"}),
    ]));
    const contact=await getFacultyContactDetail(faculty,{
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
    const csvQuiz=await getFacultyReportCsvForDownload(faculty,{
      kind:"quiz",assessmentId:quiz.id,deliveryId:delivery.id,
    });
    expect(csvQuiz.csv).toContain('"NOT_ATTEMPTED"');
    expect(csvQuiz.csv).not.toContain('"ATTEMPTED"');

    await expect(getFacultyReportCsvForDownload(learner,{
      kind:"assignment",assessmentId:assignment.id,deliveryId:delivery.id,
    })).rejects.toBeDefined();
    await expect(getFacultyReportCsvForDownload(faculty,{
      kind:"quiz",assessmentId:quiz.id,deliveryId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
  });
});
