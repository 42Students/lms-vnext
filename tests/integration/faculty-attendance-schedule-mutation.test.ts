import {randomUUID} from "node:crypto";
import {afterAll,afterEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {createProgram} from "@/modules/academics/program-service";
import {createAcademicPeriod} from "@/modules/academics/period-service";
import {createCohort} from "@/modules/academics/cohort-service";
import {createSection} from "@/modules/academics/section-service";
import {createCourse} from "@/modules/courses/course-service";
import {createCourseOffering} from "@/modules/courses/offering-service";
import {createCourseSectionDelivery} from "@/modules/courses/delivery-service";
import {createCourseTeachingAssignment} from "@/modules/courses/teaching-assignment-service";
import {createLearningPath} from "@/modules/courses/learning-path-service";
import {createCourseLesson} from "@/modules/courses/lesson-service";
import {commandFacultyAttendanceSchedule} from "@/modules/attendance/faculty-schedule-mutation-service";
import {getFacultyIstMonth} from "@/modules/courses/faculty-ist-month-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
// Dates are relative to "now": the service rejects sessions starting in the
// past, so hard-coded calendar dates silently expire.
const DAY_MS=86400000;
function istDate(offsetDays:number){
 return new Date(Date.now()+offsetDays*DAY_MS+5.5*3600000).toISOString().slice(0,10);
}
function istMonthStart(monthsAhead:number){
 const [y,m]=istDate(0).split("-").map(Number) as [number,number];
 const index=y*12+(m-1)+monthsAhead;
 return String(Math.floor(index/12))+"-"+String(index%12+1).padStart(2,"0");
}
const periodEndDate=istDate(400)>"2027-12-31"?istDate(400):"2027-12-31";
const sessionDay=istDate(7);
const gridMonth=istMonthStart(2),gridPreviousMonth=istMonthStart(1);
if(!process.env.TEST_DATABASE_URL)throw new Error("Use disposable TEST_DATABASE_URL");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const admin:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"seed-college-admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.collegeAdminMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const faculty:RequestContext={
 user:{id:SEED_IDS.facultyUser,identityUid:"seed-faculty",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.facultyCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["FACULTY","MENTOR"]},
};
const learner:RequestContext={
 user:{id:SEED_IDS.learnerUser,identityUid:"seed-learner",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:SEED_IDS.learnerCollegeAMembership,collegeId:SEED_IDS.collegeA,organizationId:SEED_IDS.organization,status:"ACTIVE",roles:["LEARNER"]},
};
type Fixture={periodId:string;programId:string;cohortId:string;sectionId:string;
  courseId:string;offeringId:string;deliveryId:string;pathId:string;lessonId:string};
let active:Fixture|null=null;
async function cleanup(){
 const f=active;if(!f)return;
 await pool.query("delete from section_schedule_events where section_id=$1",[f.sectionId]);
 await pool.query("delete from lesson_contents where lesson_id=$1",[f.lessonId]);
 await pool.query("delete from course_lessons where id=$1",[f.lessonId]);
 await pool.query("delete from course_learning_paths where id=$1",[f.pathId]);
 await pool.query("delete from course_teaching_assignments where delivery_id=$1",[f.deliveryId]);
 await pool.query("delete from course_section_deliveries where id=$1",[f.deliveryId]);
 await pool.query("delete from course_offerings where id=$1",[f.offeringId]);
 await pool.query("delete from program_term_courses where course_id=$1",[f.courseId]);
 await pool.query("delete from courses where id=$1",[f.courseId]);
 await pool.query("delete from sections where id=$1",[f.sectionId]);
 await pool.query("delete from cohorts where id=$1",[f.cohortId]);
 await pool.query("delete from program_terms where program_id=$1",[f.programId]);
 await pool.query("delete from programs where id=$1",[f.programId]);
 await pool.query("delete from academic_periods where id=$1",[f.periodId]);
 active=null;
}
async function fixture(){
 const tag=randomUUID().slice(0,8).toUpperCase();
 const program=await createProgram(admin,{departmentId:SEED_IDS.departmentA,
   name:"C4 live "+tag,code:"C4LIVE-"+tag+"-P",durationTerms:8});
 const period=await createAcademicPeriod(admin,{collegeId:SEED_IDS.collegeA,
   name:"C4 live period "+tag,code:"C4LIVE-"+tag+"-A",
   startDate:"2026-07-01",endDate:periodEndDate});
 const cohort=await createCohort(admin,{programId:program.id,
   name:"C4 live cohort "+tag,code:"C4LIVE-"+tag+"-C",startPeriodId:period.id});
 const section=await createSection(admin,{cohortId:cohort.id,academicPeriodId:period.id,
   name:"C4 live section "+tag,code:"C4LIVE-"+tag+"-S"});
 const course=await createCourse(admin,{departmentId:SEED_IDS.departmentA,
   name:"C4 live course "+tag,code:"C4LIVE-"+tag+"-R"});
 const offering=await createCourseOffering(admin,{courseId:course.id,
   cohortId:cohort.id,academicPeriodId:period.id,type:"CORE",credits:4,displayOrder:0});
 const delivery=await createCourseSectionDelivery(admin,{offeringId:offering.id,sectionId:section.id});
 active={periodId:period.id,programId:program.id,cohortId:cohort.id,
   sectionId:section.id,courseId:course.id,offeringId:offering.id,
   deliveryId:delivery.id,pathId:"",lessonId:""};
 await createCourseTeachingAssignment(admin,{deliveryId:delivery.id,
   membershipId:SEED_IDS.facultyCollegeAMembership,role:"PRIMARY"});
 const path=await createLearningPath(admin,{offeringId:offering.id,title:"C4 Live "+tag});
 active.pathId=path.id;
 const lesson=await createCourseLesson(admin,{learningPathId:path.id,
   name:"C4 Classroom "+tag,sequence:0});
 active.lessonId=lesson.id;
 return {delivery,lesson};
}
afterEach(cleanup);
afterAll(async()=>{try{await cleanup();}finally{await pool.end();await closeDatabaseConnection();}});
const time={startsAt:sessionDay+"T09:00:00+05:30",endsAt:sessionDay+"T10:00:00+05:30"};
describe("Faculty attendance session scheduling on disposable PostgreSQL",()=>{
 it("reads created persisted session in the precise IST date grid and rejects foreign month scope",async()=>{
  const {delivery}=await fixture();
  const created=await commandFacultyAttendanceSchedule(faculty,{deliveryId:delivery.id},{
   action:"CREATE",title:"Faculty October IST calendar",
   description:"Registered classroom",location:"Room C4",
   startsAt:gridMonth+"-14T23:50:00+05:30",
   endsAt:gridMonth+"-15T00:30:00+05:30",confirm:true,
  });
  const result=await getFacultyIstMonth(faculty,{
   month:gridMonth,deliveryId:delivery.id,
  });
  expect(result.schedule.courses.some(c=>c.deliveryId===delivery.id)).toBe(true);
  expect(result.grid.authorized).toBe(true);
  expect(result.grid.days).toHaveLength(42);
  expect(result.grid.days.find(d=>d.key===gridMonth+"-14")?.events.some(e=>e.id===created.id)).toBe(true);
  expect(result.grid.days.find(d=>d.key===gridMonth+"-15")?.events.some(e=>e.id===created.id)).toBe(true);
  const previous=await getFacultyIstMonth(faculty,{
   month:gridPreviousMonth,deliveryId:delivery.id,
  });
  expect(previous.grid.days.some(d=>d.events.some(e=>e.id===created.id))).toBe(false);
  await expect(getFacultyIstMonth(faculty,{
   month:gridMonth,deliveryId:SEED_IDS.collegeB,
  })).rejects.toBeDefined();
  await expect(getFacultyIstMonth(learner,{
   month:gridMonth,deliveryId:delivery.id,
  })).rejects.toBeDefined();
  await expect(getFacultyIstMonth({...faculty,user:{...faculty.user,platformStatus:"DISABLED"}},{
   month:gridMonth,deliveryId:delivery.id,
  })).rejects.toBeDefined();
  await expect(getFacultyIstMonth(faculty,{
   month:"2026-13",deliveryId:delivery.id,
  })).rejects.toBeDefined();
 });
 it("creates scoped attendance events, prevents collisions and audits each actual change",async()=>{
  const {delivery}=await fixture();
  const payload={action:"CREATE" as const,title:"Faculty C4 Attendance",
    description:null,location:"Room C4",...time,confirm:true as const};
  const created=await commandFacultyAttendanceSchedule(faculty,{deliveryId:delivery.id},payload);
  expect(created.status).toBe("SCHEDULED");
  const [audit]=await pool.query(
    "select count(*)::int as total from activity_events where subject_id=$1 and summary=$2",
    [created.id,"Faculty attendance session scheduled"],
  ).then(result=>result.rows);
  expect(audit.total).toBe(1);
  await expect(commandFacultyAttendanceSchedule(faculty,{deliveryId:delivery.id},payload))
    .rejects.toBeDefined();
  await expect(commandFacultyAttendanceSchedule(learner,{deliveryId:delivery.id},payload))
    .rejects.toBeDefined();
  await expect(commandFacultyAttendanceSchedule(faculty,{deliveryId:SEED_IDS.collegeB},payload))
    .rejects.toBeDefined();
  const update={
    action:"RESCHEDULE" as const,sessionId:created.id,
    expectedUpdatedAt:created.updatedAt.toISOString(),
    title:"Faculty C4 Attendance Changed",description:"Rescheduled",location:"Room C5",
    startsAt:sessionDay+"T10:00:00+05:30",endsAt:sessionDay+"T11:00:00+05:30",
    confirm:true as const,
  };
  const saved=await commandFacultyAttendanceSchedule(faculty,{deliveryId:delivery.id},update);
  expect(saved.status).toBe("SCHEDULED");
  await expect(commandFacultyAttendanceSchedule(faculty,{deliveryId:delivery.id},update))
    .rejects.toBeDefined();
  await expect(commandFacultyAttendanceSchedule(faculty,{deliveryId:delivery.id},{
    ...update,expectedUpdatedAt:saved.updatedAt.toISOString(),collegeId:SEED_IDS.collegeB,
  })).rejects.toBeDefined();
  const audits=await pool.query(
    "select count(*)::int as total from activity_events where subject_id=$1 and summary like 'Faculty attendance session%'",
    [created.id],
  );
  expect(audits.rows[0].total).toBe(2);
 });
});
