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
import {commandFacultyLiveClass} from "@/modules/courses/faculty-live-mutation-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
// Live classes must start in the future; keep every slot relative to "now"
// (IST calendar days) so the suite does not expire on a fixed date.
function istDate(offsetDays:number){
 return new Date(Date.now()+offsetDays*86400000+5.5*3600000).toISOString().slice(0,10);
}
const periodEndDate=istDate(400)>"2027-12-31"?istDate(400):"2027-12-31";
const day1=istDate(11),day2=istDate(12),day3=istDate(13);
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
 await pool.query("delete from section_schedule_events where section_id=$1::uuid",[f.sectionId]);
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
const time={startsAt:day1+"T09:00:00+05:30",endsAt:day1+"T10:00:00+05:30"};
describe("Faculty live session create, edit, cancel with PostgreSQL",()=>{
 it("writes once with actor audit, denies collision, foreign and stale scopes",async()=>{
   const {delivery,lesson}=await fixture();
   const payload={action:"CREATE" as const,lessonId:lesson.id,title:"Faculty C4 Live",
     meetingUrl:"https://meet.google.com/class",...time,confirm:true as const};
   const created=await commandFacultyLiveClass(faculty,{deliveryId:delivery.id},payload);
   expect(created.status).toBe("PUBLISHED");
   const [audit]=await pool.query("select count(*)::int as total from activity_events where subject_id=$1 and summary=$2",
     [created.id,"Faculty live class scheduled"]).then(result=>result.rows);
   expect(audit.total).toBe(1);
   await expect(commandFacultyLiveClass(faculty,{deliveryId:delivery.id},payload))
      .rejects.toBeDefined();
   await expect(commandFacultyLiveClass(learner,{deliveryId:delivery.id},payload))
      .rejects.toBeDefined();
   await expect(commandFacultyLiveClass(faculty,{deliveryId:SEED_IDS.collegeB},payload))
      .rejects.toBeDefined();
   const edited=await commandFacultyLiveClass(faculty,{deliveryId:delivery.id},{
     action:"EDIT",contentId:created.id,expectedUpdatedAt:created.updatedAt.toISOString(),
     title:"Faculty C4 Rescheduled",meetingUrl:"https://meet.google.com/class-new",
     startsAt:day1+"T10:00:00+05:30",
     endsAt:day1+"T11:00:00+05:30",confirm:true,
   });
   expect(edited.status).toBe("PUBLISHED");
   await expect(commandFacultyLiveClass(faculty,{deliveryId:delivery.id},{
     action:"CANCEL",contentId:created.id,expectedUpdatedAt:created.updatedAt.toISOString(),confirm:true,
   })).rejects.toMatchObject({code:"LESSON_CONTENT_STALE_VERSION"});
   const cancelled=await commandFacultyLiveClass(faculty,{deliveryId:delivery.id},{
     action:"CANCEL",contentId:created.id,expectedUpdatedAt:edited.updatedAt.toISOString(),confirm:true,
   });
   expect(cancelled.status).toBe("ARCHIVED");
   const row=await pool.query("select count(*)::int as total from activity_events where subject_id=$1 and summary like 'Faculty live class%'",
      [created.id]);
   expect(row.rows[0].total).toBe(3);
   const leaked=await pool.query("select count(*)::int as total from activity_events where subject_id=$1 and metadata::text like '%meet.google.com%'",
      [created.id]);
   expect(leaked.rows[0].total).toBe(0);
 });
});

describe("Faculty live scheduling persisted revocation",()=>{
 it("blocks a Faculty actor once the FACULTY role is removed from the database",async()=>{
  const {delivery,lesson}=await fixture();
  const roles=await pool.query<{id:string}>(
   "select id from membership_roles where membership_id=$1::uuid and role=$2::membership_role",
   [SEED_IDS.facultyCollegeAMembership,"FACULTY"]);
  const originalRoleId=roles.rows[0]?.id;
  expect(originalRoleId).toBeDefined();
  await pool.query("delete from membership_roles where id=$1::uuid",[originalRoleId]);
  try {
   await expect(commandFacultyLiveClass(faculty,{deliveryId:delivery.id},{
    action:"CREATE",lessonId:lesson.id,title:"Revoked instructor",
    meetingUrl:"https://meet.google.com/revoked",
    startsAt:day2+"T09:00:00+05:30",
    endsAt:day2+"T10:00:00+05:30",confirm:true,
   })).rejects.toMatchObject({code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
  }finally{
   await pool.query("insert into membership_roles(id,membership_id,role) values($1::uuid,$2::uuid,$3::membership_role) on conflict do nothing",
    [originalRoleId,SEED_IDS.facultyCollegeAMembership,"FACULTY"]);
  }
 });
});

describe("Faculty live class schedule event occupancy",()=>{
 it("rejects times already occupied by the same Section calendar",async()=>{
  const {delivery,lesson}=await fixture();
  await pool.query("insert into section_schedule_events(section_id,faculty_membership_id,title,starts_at,ends_at) values ($1::uuid,$2::uuid,$3::text,$4::timestamptz,$5::timestamptz)",
   [active!.sectionId,SEED_IDS.facultyCollegeAMembership,"Classroom occupied",
    day3+"T09:00:00+05:30",day3+"T10:00:00+05:30"]);
  await expect(commandFacultyLiveClass(faculty,{deliveryId:delivery.id},{
   action:"CREATE",lessonId:lesson.id,title:"Conflicting online session",
   meetingUrl:"https://meet.google.com/conflict",
   startsAt:day3+"T09:30:00+05:30",
   endsAt:day3+"T10:30:00+05:30",confirm:true,
  })).rejects.toMatchObject({code:"SCHEDULE_EVENT_CONFLICT"});
 });
});
