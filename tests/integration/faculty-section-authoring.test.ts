import {afterAll,beforeEach,describe,it,expect} from "vitest";
import {randomUUID} from "node:crypto";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {createProgram} from "@/modules/academics/program-service";
import {createAcademicPeriod} from "@/modules/academics/period-service";
import {createCohort} from "@/modules/academics/cohort-service";
import {createSection} from "@/modules/academics/section-service";
import {createCourse} from "@/modules/courses/course-service";
import {createCourseOffering} from "@/modules/courses/offering-service";
import {createCourseSectionDelivery} from "@/modules/courses/delivery-service";
import {createCourseTeachingAssignment} from "@/modules/courses/teaching-assignment-service";
import {createLearningPath,transitionLearningPath} from "@/modules/courses/learning-path-service";
import {createCourseLesson} from "@/modules/courses/lesson-service";
import {commandFacultyAssignment} from "@/modules/courses/faculty-assignment-authoring-service";
import {commandFacultyQuiz} from "@/modules/courses/faculty-quiz-authoring-service";
import {createLessonContent,transitionLessonContent} from "@/modules/courses/lesson-content-service";
import {getFacultyLiveClasses} from "@/modules/courses/faculty-live-classes-service";
import {getFacultyAssignmentReport,getFacultyQuizReport} from "@/modules/courses/faculty-assessment-report-service";
import {getFacultyQuizQuestionCsvForDownload} from "@/modules/courses/faculty-quiz-question-csv-service";
import {getFacultyReportCsvForDownload} from "@/modules/courses/faculty-report-csv-service";

if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL is mandatory.");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const tag="C4AUTH-"+randomUUID().slice(0,11).toUpperCase();
const like=tag+"-%";
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
async function cleanup(){
 // Intentionally do not delete from immutable activity_events or notification history.
 await pool.query(`delete from quiz_options where question_id in(
  select qq.id from quiz_questions qq join course_quizzes q on q.id=qq.quiz_id
  join course_lessons l on l.id=q.lesson_id join course_learning_paths lp on lp.id=l.learning_path_id
  join course_offerings o on o.id=lp.offering_id join courses c on c.id=o.course_id where c.code like $1)`,[like]);
 await pool.query(`delete from quiz_questions where quiz_id in(
  select q.id from course_quizzes q join course_lessons l on l.id=q.lesson_id
  join course_learning_paths lp on lp.id=l.learning_path_id
  join course_offerings o on o.id=lp.offering_id join courses c on c.id=o.course_id where c.code like $1)`,[like]);
 for(const table of ["course_quizzes","course_assignments"]){
  await pool.query(`delete from ${table} where lesson_id in(
   select l.id from course_lessons l join course_learning_paths lp on lp.id=l.learning_path_id
   join course_offerings o on o.id=lp.offering_id join courses c on c.id=o.course_id
   where c.code like $1)`,[like]);
 }
 await pool.query(`delete from lesson_contents where lesson_id in(
  select l.id from course_lessons l join course_learning_paths lp on lp.id=l.learning_path_id
  join course_offerings o on o.id=lp.offering_id join courses c on c.id=o.course_id where c.code like $1)`,[like]);
 await pool.query(`delete from course_lessons where learning_path_id in(
  select lp.id from course_learning_paths lp join course_offerings o on o.id=lp.offering_id
  join courses c on c.id=o.course_id where c.code like $1)`,[like]);
 await pool.query(`delete from course_learning_paths where offering_id in(
  select o.id from course_offerings o join courses c on c.id=o.course_id where c.code like $1)`,[like]);
 await pool.query(`delete from course_teaching_assignments where delivery_id in(
  select d.id from course_section_deliveries d join course_offerings o on o.id=d.offering_id
  join courses c on c.id=o.course_id where c.code like $1)`,[like]);
 await pool.query(`delete from course_section_deliveries where offering_id in(
  select o.id from course_offerings o join courses c on c.id=o.course_id where c.code like $1)`,[like]);
 await pool.query("delete from course_offerings where course_id in (select id from courses where code like $1)",[like]);
 await pool.query("delete from program_term_courses where course_id in (select id from courses where code like $1)",[like]);
 await pool.query("delete from courses where code like $1",[like]);
 await pool.query(`delete from sections where cohort_id in(
  select h.id from cohorts h join programs p on p.id=h.program_id where p.code like $1)`,[like]);
 await pool.query("delete from cohorts where program_id in(select id from programs where code like $1)",[like]);
 await pool.query("delete from program_terms where program_id in(select id from programs where code like $1)",[like]);
 await pool.query("delete from programs where code like $1",[like]);
 await pool.query("delete from academic_periods where code like $1",[like]);
}
async function fixture(){
 const p=await createProgram(admin,{
  departmentId:SEED_IDS.departmentA,name:"Authoring "+tag,code:tag+"-PROGRAM",durationTerms:8,
 });
 const period=await createAcademicPeriod(admin,{
  collegeId:SEED_IDS.collegeA,name:"Period "+tag,code:tag+"-PERIOD",
  startDate:"2026-07-01",endDate:"2027-12-31",
 });
 const cohort=await createCohort(admin,{
  programId:p.id,name:"Cohort "+tag,code:tag+"-COHORT",startPeriodId:period.id,
 });
 const section=await createSection(admin,{
  cohortId:cohort.id,academicPeriodId:period.id,name:"Section "+tag,code:tag+"-SEC",
 });
 const course=await createCourse(admin,{
  departmentId:SEED_IDS.departmentA,name:"Course "+tag,code:tag+"-COURSE",
 });
 const offer=await createCourseOffering(admin,{
  courseId:course.id,cohortId:cohort.id,academicPeriodId:period.id,
  type:"CORE",credits:3,displayOrder:0,
 });
 const delivery=await createCourseSectionDelivery(admin,{
  offeringId:offer.id,sectionId:section.id,
 });
 await createCourseTeachingAssignment(admin,{
  deliveryId:delivery.id,membershipId:SEED_IDS.facultyCollegeAMembership,role:"PRIMARY",
 });
 const path=await createLearningPath(admin,{offeringId:offer.id,title:"Path "+tag});
 const lesson=await createCourseLesson(admin,{learningPathId:path.id,name:"Lesson "+tag,sequence:0});
 await transitionLearningPath(admin,path.id,{action:"PUBLISH"});
 return {delivery,lesson};
}
beforeEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});

describe("Faculty own-delivery assessment command successful DB writes and denials",()=>{
 it("reads a real published HTTPS live class with exact Faculty Section scope",async()=>{
  const {delivery,lesson}=await fixture();
  const live=await createLessonContent(faculty,{
   lessonId:lesson.id,deliveryId:delivery.id,title:"Live FIFO Session "+tag,
   contentType:"LIVE_CLASS",points:0,sequence:0,
   externalUrl:"https://meet.example.invalid/course/"+tag.toLowerCase(),
   startsAt:"2026-10-20T10:00:00.000Z",endsAt:"2026-10-20T11:00:00.000Z",
  });
  await transitionLessonContent(faculty,live.id,{action:"PUBLISH"});
  const list=await getFacultyLiveClasses(faculty,{view:"ALL",deliveryId:delivery.id});
  expect(list.items).toEqual(expect.arrayContaining([
   expect.objectContaining({id:live.id,deliveryId:delivery.id,
    joinUrl:"https://meet.example.invalid/course/"+tag.toLowerCase()}),
  ]));
  await expect(getFacultyLiveClasses(learner,{view:"ALL"})).rejects.toBeDefined();
  await expect(getFacultyLiveClasses(faculty,{view:"ALL",
   deliveryId:SEED_IDS.collegeB})).rejects.toBeDefined();
  await expect(getFacultyLiveClasses({
   ...faculty,membership:{...faculty.membership!,status:"SUSPENDED"},
  },{view:"ALL"})).rejects.toBeDefined();
 });
 it("serves a real Section Assignment report and regenerates privacy-safe CSV with deny checks",async()=>{
  const {delivery,lesson}=await fixture();
  const created=await commandFacultyAssignment(faculty,{deliveryId:delivery.id},{
    action:"CREATE",lessonId:lesson.id,sequence:4,title:"Faculty Report "+tag,
    description:"Assignment report acceptance",dueAt:"2099-01-01T00:00:00.000Z",maxPoints:10,confirmed:true,
  });
  const published=await commandFacultyAssignment(faculty,{deliveryId:delivery.id},{
    action:"PUBLISH",assignmentId:created.id,
    expectedUpdatedAt:created.updatedAt.toISOString(),confirmed:true,
  });
  expect(published.status).toBe("PUBLISHED");
  const report=await getFacultyAssignmentReport(faculty,created.id,delivery.id);
  expect(report.assignment).toMatchObject({
    id:created.id,deliveryId:delivery.id,title:"Faculty Report "+tag,maxPoints:10,
  });
  expect(report.metrics).toMatchObject({
    eligibleLearners:0,submitted:0,missing:0,graded:0,averagePercent:null,
  });
  expect(report.distribution.every(bucket=>bucket.count===0)).toBe(true);
  const file=await getFacultyReportCsvForDownload(faculty,{
    kind:"assignment",assessmentId:created.id,deliveryId:delivery.id,
  });
  expect(file.filename.startsWith("faculty-assignment-report-")).toBe(true);
  expect(file.filename.endsWith(".csv")).toBe(true);
  expect(file.csv).toContain('"Learner","Response","Score","Percent","Submitted at (IST)","Details"');
  expect(file.csv).not.toContain("@example.");
  expect(file.csv).not.toContain("learner.seed@example.com");
  expect(file.omittedRows).toBe(0);
  await expect(getFacultyAssignmentReport(learner,created.id,delivery.id)).rejects.toBeDefined();
  await expect(getFacultyAssignmentReport(faculty,created.id,SEED_IDS.collegeB)).rejects.toBeDefined();
  await expect(getFacultyAssignmentReport({...faculty,
    membership:{...faculty.membership!,status:"SUSPENDED"}},created.id,delivery.id)).rejects.toBeDefined();
  await expect(getFacultyReportCsvForDownload(learner,{
    kind:"assignment",assessmentId:created.id,deliveryId:delivery.id,
  })).rejects.toBeDefined();
  await expect(getFacultyReportCsvForDownload(faculty,{
    kind:"assignment",assessmentId:created.id,deliveryId:SEED_IDS.collegeB,
  })).rejects.toBeDefined();
  await expect(getFacultyReportCsvForDownload(faculty,{
    kind:"assignment",assessmentId:created.id,deliveryId:delivery.id,collegeId:SEED_IDS.collegeB,
  })).rejects.toBeDefined();
 });
 it("creates and audits Assignment draft, rejects stale/foreign, then publishes and archives",async()=>{
  const {delivery,lesson}=await fixture();
  const create={action:"CREATE" as const,lessonId:lesson.id,sequence:0,title:"Task "+tag,
   description:"Explain FIFO",dueAt:"2099-01-01T00:00:00.000Z",maxPoints:10,confirmed:true as const};
  const created=await commandFacultyAssignment(faculty,{deliveryId:delivery.id},create);
  expect(created.status).toBe("DRAFT");
  await expect(commandFacultyAssignment(learner,{deliveryId:delivery.id},create)).rejects.toBeDefined();
  await expect(commandFacultyAssignment(faculty,{deliveryId:SEED_IDS.collegeB},create)).rejects.toBeDefined();
  const edited=await commandFacultyAssignment(faculty,{deliveryId:delivery.id},{
   action:"EDIT",assignmentId:created.id,expectedUpdatedAt:created.updatedAt.toISOString(),
   title:"Updated "+tag,description:"New instructions",dueAt:"2099-01-01T00:00:00.000Z",maxPoints:12,confirmed:true,
  });
  await expect(commandFacultyAssignment(faculty,{deliveryId:delivery.id},{
   action:"ARCHIVE",assignmentId:created.id,expectedUpdatedAt:created.updatedAt.toISOString(),confirmed:true,
  })).rejects.toBeDefined();
  const published=await commandFacultyAssignment(faculty,{deliveryId:delivery.id},{
   action:"PUBLISH",assignmentId:created.id,expectedUpdatedAt:edited.updatedAt.toISOString(),confirmed:true,
  });
  expect(published.status).toBe("PUBLISHED");
  const archived=await commandFacultyAssignment(faculty,{deliveryId:delivery.id},{
   action:"ARCHIVE",assignmentId:created.id,expectedUpdatedAt:published.updatedAt.toISOString(),confirmed:true,
  });
  expect(archived.status).toBe("ARCHIVED");
  const audit=await pool.query("select event_type from activity_events where subject_id = $1::text and event_type like 'courses.assignment.%'",[created.id]);
  expect(audit.rows.map(row=>row.event_type).sort()).toEqual([
   "courses.assignment.archived","courses.assignment.created",
   "courses.assignment.published","courses.assignment.updated",
  ]);
 });
 it("denies a stale Assignment token from a SQL-default now() snapshot",async()=>{
  const {delivery,lesson}=await fixture();
  const created=await commandFacultyAssignment(faculty,{deliveryId:delivery.id},{
   action:"CREATE",lessonId:lesson.id,sequence:8,title:"SQL Version "+tag,
   description:"Initial notes",dueAt:"2099-01-01T00:00:00.000Z",maxPoints:10,confirmed:true,
  });
  const versions=await pool.query<{updated_at:Date}>(
   "update course_assignments set updated_at=now() where id=$1 returning updated_at",
   [created.id]);
  const current=versions.rows[0]!.updated_at.toISOString();
  const edit={action:"EDIT" as const,assignmentId:created.id,expectedUpdatedAt:current,
   title:"Version-corrected "+tag,description:"Revised",dueAt:"2099-01-01T00:00:00.000Z",maxPoints:10,
   confirmed:true as const};
  await expect(commandFacultyAssignment(faculty,{deliveryId:delivery.id},{
   ...edit,expectedUpdatedAt:"2026-01-01T00:00:00.000Z",
  })).rejects.toMatchObject({code:"FACULTY_ASSIGNMENT_STALE_VERSION"});
  await expect(commandFacultyAssignment(learner,{deliveryId:delivery.id},edit))
   .rejects.toBeDefined();
  await expect(commandFacultyAssignment(faculty,{deliveryId:SEED_IDS.collegeB},edit))
   .rejects.toBeDefined();
  const changed=await commandFacultyAssignment(faculty,{deliveryId:delivery.id},edit);
  expect(changed.title).toBe("Version-corrected "+tag);
  await expect(commandFacultyAssignment(faculty,{deliveryId:delivery.id},edit))
   .rejects.toMatchObject({code:"FACULTY_ASSIGNMENT_STALE_VERSION"});
  const history=await pool.query<{n:string}>(`select count(*)::text as n
   from activity_events where subject_id=$1::text
   and event_type='courses.assignment.updated'`,[created.id]);
  expect(history.rows[0]?.n).toBe("1");
 });
 it("serves real Section Quiz question accuracy and privacy-safe filtered CSV",async()=>{
   const {delivery,lesson}=await fixture();
   const created=await commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
    action:"CREATE",lessonId:lesson.id,sequence:6,title:"Report Quiz "+tag,
    description:"Report positive PostgreSQL witness",dueAt:"2099-01-01T00:00:00.000Z",maxAttempts:2,
    questions:[{type:"SINGLE_CHOICE",prompt:"Which structure is FIFO?",points:5,sequence:0,
      options:[{text:"Queue",correct:true,sequence:0},{text:"Stack",correct:false,sequence:1}]}],
    confirmed:true,
   });
   const published=await commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
    action:"PUBLISH",quizId:created.id,expectedUpdatedAt:created.updatedAt.toISOString(),confirmed:true,
   });
   expect(published.status).toBe("PUBLISHED");
   const report=await getFacultyQuizReport(faculty,created.id,delivery.id);
   expect(report.quiz).toMatchObject({
    id:created.id,deliveryId:delivery.id,title:"Report Quiz "+tag,
   });
   expect(report.metrics).toMatchObject({
    totalAttempts:0,submittedLearners:0,eligibleLearners:0,
    notAttempted:0,questionCount:1,averagePercent:null,
   });
   expect(report.questions).toEqual([expect.objectContaining({
    prompt:"Which structure is FIFO?",answeredCount:0,correctCount:0,accuracyPercent:null,
   })]);
   const all=await getFacultyReportCsvForDownload(faculty,{
    kind:"quiz",assessmentId:created.id,deliveryId:delivery.id,filter:"ALL",
   });
   const attempted=await getFacultyReportCsvForDownload(faculty,{
    kind:"quiz",assessmentId:created.id,deliveryId:delivery.id,filter:"ATTEMPTED",
   });
   const missed=await getFacultyReportCsvForDownload(faculty,{
    kind:"quiz",assessmentId:created.id,deliveryId:delivery.id,filter:"NOT_ATTEMPTED",
   });
   expect(all.filename.startsWith("faculty-quiz-report-")).toBe(true);
   expect(all.csv).toContain('"Learner","Response","Score","Percent","Submitted at (IST)","Details"');
   expect(all.csv).not.toContain("@example.");
   expect(all.omittedRows).toBe(0);
   expect(attempted.csv).toBe(all.csv);
   expect(missed.csv).toBe(all.csv);
   const questions=await getFacultyQuizQuestionCsvForDownload(faculty,{
    quizId:created.id,deliveryId:delivery.id,
   });
   expect(questions.filename).toContain("questions");
   expect(questions.csv).toContain('"Question","Points","Answered","Correct","Accuracy (%)"');
   expect(questions.csv).toContain("Which structure is FIFO?");
   expect(questions.csv).not.toContain("@example.");
   expect(questions.omittedRows).toBe(0);
   await expect(getFacultyQuizQuestionCsvForDownload(learner,{
    quizId:created.id,deliveryId:delivery.id,
   })).rejects.toBeDefined();
   await expect(getFacultyQuizQuestionCsvForDownload(faculty,{
    quizId:created.id,deliveryId:SEED_IDS.collegeB,
   })).rejects.toBeDefined();
   await expect(getFacultyQuizQuestionCsvForDownload(faculty,{
    quizId:created.id,deliveryId:delivery.id,collegeId:SEED_IDS.collegeB,
   })).rejects.toBeDefined();
   await expect(getFacultyQuizReport(learner,created.id,delivery.id)).rejects.toBeDefined();
   await expect(getFacultyQuizReport(faculty,created.id,SEED_IDS.collegeB)).rejects.toBeDefined();
   await expect(getFacultyReportCsvForDownload(learner,{
    kind:"quiz",assessmentId:created.id,deliveryId:delivery.id,
   })).rejects.toBeDefined();
   await expect(getFacultyReportCsvForDownload(faculty,{
    kind:"quiz",assessmentId:created.id,deliveryId:SEED_IDS.collegeB,
   })).rejects.toBeDefined();
   await expect(getFacultyReportCsvForDownload(faculty,{
    kind:"quiz",assessmentId:created.id,deliveryId:delivery.id,collegeId:SEED_IDS.collegeB,
   })).rejects.toBeDefined();
 });
 it("edits published and closed quiz metadata without mutating its immutable question bank",async()=>{
  const {delivery,lesson}=await fixture();
  const questions=[{type:"SINGLE_CHOICE" as const,prompt:"Immutable prompt?",points:5,sequence:0,
   options:[{text:"Yes",correct:true,sequence:0},{text:"No",correct:false,sequence:1}]}];
  const created=await commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
   action:"CREATE",lessonId:lesson.id,sequence:7,title:"Metadata Quiz "+tag,
   description:"Before publication",dueAt:"2099-01-01T00:00:00.000Z",maxAttempts:2,questions,confirmed:true,
  });
  const published=await commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
   action:"PUBLISH",quizId:created.id,expectedUpdatedAt:created.updatedAt.toISOString(),confirmed:true,
  });
  await expect(commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
   action:"EDIT",quizId:created.id,expectedUpdatedAt:published.updatedAt.toISOString(),
   title:"Illegal bank rewrite",description:null,dueAt:"2099-01-01T00:00:00.000Z",maxAttempts:2,questions,confirmed:true,
  })).rejects.toMatchObject({code:"INVALID_QUIZ_TRANSITION"});
  const metadata=await commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
   action:"EDIT",quizId:created.id,expectedUpdatedAt:published.updatedAt.toISOString(),
   title:"Published metadata "+tag,description:"Safe summary",dueAt:"2099-01-01T00:00:00.000Z",maxAttempts:2,confirmed:true,
  });
  expect(metadata.status).toBe("PUBLISHED");
  expect(metadata.title).toBe("Published metadata "+tag);
  await expect(commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
   action:"EDIT",quizId:created.id,expectedUpdatedAt:published.updatedAt.toISOString(),
   title:"Stale metadata",description:null,dueAt:"2099-01-01T00:00:00.000Z",maxAttempts:2,confirmed:true,
  })).rejects.toMatchObject({code:"FACULTY_QUIZ_STALE_VERSION"});
  const count=await pool.query<{n:string}>(`select count(*)::text as n from quiz_questions where quiz_id=$1`,[created.id]);
  expect(count.rows[0]?.n).toBe("1");
  const optionCount=await pool.query<{n:string}>(`select count(*)::text as n from quiz_options
   where question_id in(select id from quiz_questions where quiz_id=$1)`,[created.id]);
  expect(optionCount.rows[0]?.n).toBe("2");
  const closed=await commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
   action:"CLOSE",quizId:created.id,expectedUpdatedAt:metadata.updatedAt.toISOString(),confirmed:true,
  });
  const renamed=await commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
   action:"EDIT",quizId:created.id,expectedUpdatedAt:closed.updatedAt.toISOString(),
   title:"Closed metadata "+tag,description:"Preserved learner history",dueAt:"2099-01-01T00:00:00.000Z",maxAttempts:2,confirmed:true,
  });
  expect(renamed.status).toBe("CLOSED");
  expect(renamed.title).toBe("Closed metadata "+tag);
  await expect(commandFacultyQuiz(learner,{deliveryId:delivery.id},{
   action:"EDIT",quizId:created.id,expectedUpdatedAt:renamed.updatedAt.toISOString(),
   title:"Foreign edit",description:null,dueAt:"2099-01-01T00:00:00.000Z",maxAttempts:2,confirmed:true,
  })).rejects.toBeDefined();
  const audit=await pool.query<{n:string}>(`select count(*)::text as n from activity_events
   where subject_id=$1::text and event_type='courses.quiz.updated'`,[created.id]);
  expect(audit.rows[0]?.n).toBe("2");
 });
 it("rejects SQL microsecond-stale Quiz question replacement with one audited edit",async()=>{
   const {delivery,lesson}=await fixture();
   const questions=[{type:"SINGLE_CHOICE" as const,prompt:"FIFO?",points:5,sequence:0,
     options:[{text:"Queue",correct:true,sequence:0},{text:"Stack",correct:false,sequence:1}]}];
   const created=await commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
     action:"CREATE",lessonId:lesson.id,sequence:9,title:"Microsecond Quiz "+tag,
     description:null,dueAt:"2099-01-01T00:00:00.000Z",maxAttempts:2,questions,confirmed:true,
   });
   const snapshot=await pool.query<{updated_at:Date}>(
     "update course_quizzes set updated_at=now() where id=$1 returning updated_at",[created.id]);
   const edit={action:"EDIT" as const,quizId:created.id,
     expectedUpdatedAt:snapshot.rows[0]!.updated_at.toISOString(),
     title:"Edited Microsecond Quiz "+tag,description:"Revised",dueAt:"2099-01-01T00:00:00.000Z",maxAttempts:2,
     questions,confirmed:true as const};
   await expect(commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
     ...edit,expectedUpdatedAt:"2026-01-01T00:00:00.000Z",
   })).rejects.toMatchObject({code:"FACULTY_QUIZ_STALE_VERSION"});
   await expect(commandFacultyQuiz(learner,{deliveryId:delivery.id},edit))
     .rejects.toBeDefined();
   await expect(commandFacultyQuiz(faculty,{deliveryId:SEED_IDS.collegeB},edit))
     .rejects.toBeDefined();
   const changed=await commandFacultyQuiz(faculty,{deliveryId:delivery.id},edit);
   expect(changed.title).toBe("Edited Microsecond Quiz "+tag);
   await expect(commandFacultyQuiz(faculty,{deliveryId:delivery.id},edit))
     .rejects.toMatchObject({code:"FACULTY_QUIZ_STALE_VERSION"});
   const events=await pool.query<{n:string}>(`select count(*)::text as n from activity_events
     where subject_id=$1::text and event_type='courses.quiz.updated'`,[created.id]);
   expect(events.rows[0]?.n).toBe("1");
 });
 it("validates choice answers and audit, denies old token and foreign Section",async()=>{
  const {delivery,lesson}=await fixture();
  const questions=[{
   type:"SINGLE_CHOICE" as const,prompt:"Which is FIFO?",points:5,sequence:0,
   options:[{text:"Queue",correct:true,sequence:0},{text:"Stack",correct:false,sequence:1}],
  }];
  const created=await commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
   action:"CREATE",lessonId:lesson.id,sequence:0,title:"Quiz "+tag,
   description:null,dueAt:"2099-01-01T00:00:00.000Z",maxAttempts:2,questions,confirmed:true,
  });
  expect(created.status).toBe("DRAFT");
  const updated=await commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
   action:"EDIT",quizId:created.id,expectedUpdatedAt:created.updatedAt.toISOString(),
   title:"Quiz edited "+tag,description:"Instructions",dueAt:"2099-01-01T00:00:00.000Z",maxAttempts:2,
   questions:[{...questions[0],prompt:"Updated question"}],confirmed:true,
  });
  await expect(commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
   action:"PUBLISH",quizId:created.id,expectedUpdatedAt:created.updatedAt.toISOString(),confirmed:true,
  })).rejects.toBeDefined();
  await expect(commandFacultyQuiz(learner,{deliveryId:delivery.id},{
   action:"PUBLISH",quizId:created.id,expectedUpdatedAt:updated.updatedAt.toISOString(),confirmed:true,
  })).rejects.toBeDefined();
  await expect(commandFacultyQuiz(faculty,{deliveryId:SEED_IDS.collegeB},{
   action:"PUBLISH",quizId:created.id,expectedUpdatedAt:updated.updatedAt.toISOString(),confirmed:true,
  })).rejects.toBeDefined();
  const published=await commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
   action:"PUBLISH",quizId:created.id,expectedUpdatedAt:updated.updatedAt.toISOString(),confirmed:true,
  });
  expect(published.status).toBe("PUBLISHED");
  await expect(commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
   action:"EDIT",quizId:created.id,expectedUpdatedAt:published.updatedAt.toISOString(),
   title:"Illegal",description:null,dueAt:"2099-01-01T00:00:00.000Z",maxAttempts:2,questions,confirmed:true,
  })).rejects.toBeDefined();
  const close={action:"CLOSE" as const,quizId:created.id,
   expectedUpdatedAt:published.updatedAt.toISOString(),confirmed:true as const};
  await expect(commandFacultyQuiz(learner,{deliveryId:delivery.id},close)).rejects.toBeDefined();
  const closed=await commandFacultyQuiz(faculty,{deliveryId:delivery.id},close);
  expect(closed.status).toBe("CLOSED");
  await expect(commandFacultyQuiz(faculty,{deliveryId:delivery.id},close)).rejects.toBeDefined();
  const archive={action:"ARCHIVE" as const,quizId:created.id,
   expectedUpdatedAt:closed.updatedAt.toISOString(),confirmed:true as const};
  await expect(commandFacultyQuiz(learner,{deliveryId:delivery.id},archive)).rejects.toBeDefined();
  await expect(commandFacultyQuiz(faculty,{deliveryId:SEED_IDS.collegeB},archive)).rejects.toBeDefined();
  await expect(commandFacultyQuiz(faculty,{deliveryId:delivery.id},{
   ...archive,expectedUpdatedAt:created.updatedAt.toISOString(),
  })).rejects.toBeDefined();
  const archived=await commandFacultyQuiz(faculty,{deliveryId:delivery.id},archive);
  expect(archived.status).toBe("ARCHIVED");
  await expect(commandFacultyQuiz(faculty,{deliveryId:delivery.id},archive)).rejects.toBeDefined();
  const persisted=await pool.query("select status from course_quizzes where id=$1",[created.id]);
  expect(persisted.rows).toEqual([{status:"ARCHIVED"}]);
  const audit=await pool.query("select event_type from activity_events where subject_id = $1::text and event_type like 'courses.quiz.%'",[created.id]);
  expect(audit.rows.map(row=>row.event_type).sort()).toEqual([
   "courses.quiz.archived","courses.quiz.closed","courses.quiz.created",
   "courses.quiz.published","courses.quiz.updated",
  ]);
 });
});
