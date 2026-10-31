import "server-only";

import {createHash} from "node:crypto";
import {and,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
 academicPeriods,activityEvents,assignmentSubmissions,attendanceRecords,
 attendanceSessions,collegeMemberships,
 colleges,cohorts,courseAssignments,courseDiscussionMessages,
 courseLearningPaths,courseLessons,
 courseOfferings,courseSectionDeliveries,courseTeachingAssignments,courses,
 db10Announcements,db10Skills,db10SkillSynonyms,departments,
 inAppNotifications,learnerContentProgress,learnerProfiles,
 learnerProgramEnrollments,lectureHalls,lessonContents,
 membershipRoles,organizations,placementApplications,
 placementCollegeApplicationStages,placementCollegeApplicationStageHistory,
 placementCompanies,placementCompanyRelationships,placementJobRoleOptions,
 placementJobRounds,placementJobs,placementRoundCandidateSlots,
 placementSeasons,programs,programTerms,programTermCourses,projectInstances,projectMembers,
 projectTemplates,projectTemplateVersions,sectionEnrollments,sections,
 sectionScheduleEvents,sectionScheduleEventCourses,
 systemRoles,users,
} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {appendAttendanceHistoryEvent} from "@/modules/attendance/history-event";
import {projectTemplateBlueprintSchema} from "@/modules/projects/validation";
import {learnerProfileDocumentSchema} from "@/modules/people/profile-validation";
import {
 buildE2EFixtureManifest,buildE2EFixtureSeedLedger,type E2EFixtureKey,
} from "./e2e-fixture-manifest";

/** Every auxiliary UUID uses the same deterministic v4/variant shape as
 * the public manifest, but a distinct domain label and schema-version salt.
 */
function auxId(namespace:string,label:string):string{
 const hex=createHash("sha256").update("vnext-e2e-sql-v1:"+namespace+":"+label).digest("hex");
 return [hex.slice(0,8),hex.slice(8,12),"4"+hex.slice(13,16),
  "8"+hex.slice(17,20),hex.slice(20,32)].join("-");
}
function e2eIdentityUid(phone:string){
 return "e2e-person-"+createHash("sha256").update(phone).digest("hex").slice(0,32);
}
const roleOf={
 facultyA:"FACULTY",facultyB:"FACULTY",adminA:"COLLEGE_ADMIN",
 learnerA:"LEARNER",learnerB:"LEARNER",
} as const;

export function assertE2EFixtureWriterEnabled(){
 if(process.env.NODE_ENV==="production"||
    process.env["APP_ENV"]!=="test"||
    process.env["E2E_SEED_ENABLED"]!=="true"||
    process.env["E2E_ISOLATED_DATABASE"]!=="true"||
    process.env["E2E_ALLOW_GRAPH_WRITES"]!=="true"||
    process.env["APP_E2E_SEED_ENABLED"]!=="true")
  throw new Error("E2E_SEED_DISABLED");
}

/**
 * Real FK-ordered fixtures for the modules that do not require external
 * binary attestation, placement policy migrations or backend side effects.
 * It deliberately does NOT mark videos/images READY, invent placement
 * seasons/employer access, or give the seeded administrator SYSTEM privileges.
 *
 * This graph is atomic and reproducible: all writes share one PostgreSQL
 * transaction; inserts with an existing stable ID are reused, natural-key
 * conflicts fail the transaction. No REST payload can choose a namespace.
 * A complete E2E run must still provision the explicitly missing domain
 * nodes and attest private media before activation.
 */
export async function seedIsolatedE2EAcademicGraph(
 actor:RequestContext,
 namespace=process.env["E2E_FIXTURE_NAMESPACE"]||"e2e-dev",
){
 assertE2EFixtureWriterEnabled();
 if(!isSuperAdmin(actor))throw new Error("E2E_SEED_FORBIDDEN");
 const manifest=buildE2EFixtureManifest(namespace);
 const d=manifest.ids;
 const marker=createHash("sha256").update(namespace).digest("hex").slice(0,8).toUpperCase();
 const code=(suffix:string)=>"E2E"+marker+suffix;
 const seeded=new Set<E2EFixtureKey>();
 return getDb().transaction(async tx=>{
  const [persistedActor]=await tx.select({id:users.id})
   .from(users).innerJoin(systemRoles,and(
    eq(systemRoles.userId,users.id),eq(systemRoles.role,"SUPER_ADMIN")))
   .where(and(eq(users.id,actor.user.id),eq(users.platformStatus,"ACTIVE")))
   .limit(1);
  if(!persistedActor)throw new Error("E2E_SEED_FORBIDDEN");
  // The same isolated PostgreSQL DB may have competing CI seed attempts.
  // Serialize by namespace, not by provider/app process or user-supplied key.
  await tx.execute(
   sql`select pg_advisory_xact_lock(hashtextextended(${"e2e:"+namespace},0))`
  );
  const manifestUsers={} as Record<keyof typeof roleOf,string>;
  const personas=[
   {key:"facultyA" as const,name:"E2E Teacher A"},
   {key:"facultyB" as const,name:"E2E Teacher B"},
   {key:"adminA" as const,name:"E2E Admin A"},
   {key:"learnerA" as const,name:"E2E Learner A"},
   {key:"learnerB" as const,name:"E2E Learner B"},
  ];
  for(const persona of personas){
   const phone=manifest.testPhones[persona.key];
   const uid=e2eIdentityUid(phone);
   await tx.insert(users).values({
    identityUid:uid,phoneE164:phone,displayName:persona.name,
   }).onConflictDoNothing();
   const [person]=await tx.select({
    id:users.id,phone:users.phoneE164,name:users.displayName,
    status:users.platformStatus,
   }).from(users).where(eq(users.identityUid,uid)).limit(1);
   if(!person||person.phone!==phone||person.name!==persona.name||
      person.status!=="ACTIVE")throw new Error("E2E_IDENTITY_COLLISION");
   manifestUsers[persona.key]=person.id;
  }

  for(const row of [
   {id:d.orgColleges,name:"E2E Colleges "+namespace},
   {id:d.org42Learn,name:"E2E 42Learn "+namespace},
  ]){
   await tx.insert(organizations).values(row).onConflictDoNothing();
   const [stored]=await tx.select({name:organizations.name})
    .from(organizations).where(eq(organizations.id,row.id)).limit(1);
   if(stored?.name!==row.name)throw new Error("E2E_ORGANIZATION_COLLISION");
  }
  seeded.add("orgColleges");seeded.add("org42Learn");
  for(const row of [
   {id:d.collegeA,organizationId:d.orgColleges,
    name:"E2E College A "+namespace,code:code("CA")},
   {id:d.collegeB,organizationId:d.orgColleges,
    name:"E2E College B "+namespace,code:code("CB")},
  ]){
   await tx.insert(colleges).values(row).onConflictDoNothing();
   const [stored]=await tx.select({
    organizationId:colleges.organizationId,code:colleges.code,name:colleges.name,
   }).from(colleges).where(eq(colleges.id,row.id)).limit(1);
   if(!stored||stored.organizationId!==row.organizationId||
      stored.code!==row.code||stored.name!==row.name)
    throw new Error("E2E_COLLEGE_COLLISION");
  }
  seeded.add("collegeA");seeded.add("collegeB");
  for(const row of [
   {id:d.deptA,collegeId:d.collegeA,name:"E2E Computer Science "+namespace},
   {id:d.deptB,collegeId:d.collegeB,name:"E2E Electronics "+namespace},
  ]){
   await tx.insert(departments).values(row).onConflictDoNothing();
   const [stored]=await tx.select({
    collegeId:departments.collegeId,name:departments.name,
   }).from(departments).where(eq(departments.id,row.id)).limit(1);
   if(!stored||stored.collegeId!==row.collegeId||stored.name!==row.name)
    throw new Error("E2E_DEPARTMENT_COLLISION");
  }
  seeded.add("deptA");seeded.add("deptB");
  for(const row of [
   {id:d.programA,departmentId:d.deptA,name:"E2E BTech CS "+namespace,
    code:code("PA"),durationTerms:8},
   {id:d.programB,departmentId:d.deptB,name:"E2E BTech EC "+namespace,
    code:code("PB"),durationTerms:8},
  ]){
   await tx.insert(programs).values(row).onConflictDoNothing();
   const [stored]=await tx.select({
    departmentId:programs.departmentId,name:programs.name,code:programs.code,
   }).from(programs).where(eq(programs.id,row.id)).limit(1);
   if(!stored||stored.departmentId!==row.departmentId||
      stored.name!==row.name||stored.code!==row.code)
    throw new Error("E2E_PROGRAM_COLLISION");
  }
  seeded.add("programA");seeded.add("programB");
  // Create real term parents before seeding registered 0303 course offerings.
  const termA=auxId(namespace,"programTermA"),termB=auxId(namespace,"programTermB");
  for(const row of [
   {id:termA,programId:d.programA,termNumber:1,name:"E2E Term 1 A "+namespace},
   {id:termB,programId:d.programB,termNumber:1,name:"E2E Term 1 B "+namespace},
  ]){
   await tx.insert(programTerms).values(row).onConflictDoNothing();
   const [stored]=await tx.select({
    programId:programTerms.programId,termNumber:programTerms.termNumber,
   }).from(programTerms).where(eq(programTerms.id,row.id)).limit(1);
   if(!stored||stored.programId!==row.programId||stored.termNumber!==row.termNumber)
    throw new Error("E2E_CURRICULUM_TERM_COLLISION");
  }

  const periodA=auxId(namespace,"periodA"),periodB=auxId(namespace,"periodB");
  for(const row of [
   {id:periodA,collegeId:d.collegeA,name:"E2E 2026-27 "+namespace,
    code:code("AY1"),startDate:"2026-01-01",endDate:"2027-12-31",
    status:"ACTIVE" as const},
   {id:periodB,collegeId:d.collegeB,name:"E2E 2026-27 "+namespace,
    code:code("AY2"),startDate:"2026-01-01",endDate:"2027-12-31",
    status:"ACTIVE" as const},
  ]){
   await tx.insert(academicPeriods).values(row).onConflictDoNothing();
   const [stored]=await tx.select({
    collegeId:academicPeriods.collegeId,code:academicPeriods.code,
    status:academicPeriods.status,
   }).from(academicPeriods).where(eq(academicPeriods.id,row.id)).limit(1);
   if(!stored||stored.collegeId!==row.collegeId||
      stored.code!==row.code||stored.status!=="ACTIVE")
    throw new Error("E2E_PERIOD_COLLISION");
  }
  for(const row of [
   {id:d.batchA,programId:d.programA,name:"E2E Batch A "+namespace,
    code:code("BA"),startPeriodId:periodA,status:"ACTIVE" as const},
   {id:d.batchB,programId:d.programB,name:"E2E Batch B "+namespace,
    code:code("BB"),startPeriodId:periodB,status:"ACTIVE" as const},
  ]){
   await tx.insert(cohorts).values(row).onConflictDoNothing();
   const [stored]=await tx.select({
    programId:cohorts.programId,startPeriodId:cohorts.startPeriodId,
    code:cohorts.code,
   }).from(cohorts).where(eq(cohorts.id,row.id)).limit(1);
   if(!stored||stored.programId!==row.programId||
      stored.startPeriodId!==row.startPeriodId||stored.code!==row.code)
    throw new Error("E2E_BATCH_COLLISION");
  }
  seeded.add("batchA");seeded.add("batchB");
  for(const row of [
   {id:d.classA,cohortId:d.batchA,academicPeriodId:periodA,
    name:"E2E Section A "+namespace,code:code("SA")},
   {id:d.classB,cohortId:d.batchB,academicPeriodId:periodB,
    name:"E2E Section B "+namespace,code:code("SB")},
  ]){
   await tx.insert(sections).values(row).onConflictDoNothing();
   const [stored]=await tx.select({
    cohortId:sections.cohortId,academicPeriodId:sections.academicPeriodId,
    code:sections.code,
   }).from(sections).where(eq(sections.id,row.id)).limit(1);
   if(!stored||stored.cohortId!==row.cohortId||
      stored.academicPeriodId!==row.academicPeriodId||stored.code!==row.code)
    throw new Error("E2E_SECTION_COLLISION");
  }
  seeded.add("classA");seeded.add("classB");

  for(const persona of personas){
   const isB=persona.key==="facultyB"||persona.key==="learnerB";
   const collegeId=isB?d.collegeB:d.collegeA;
   await tx.insert(collegeMemberships).values({
    id:d[persona.key],collegeId,userId:manifestUsers[persona.key],
   }).onConflictDoNothing();
   const [bound]=await tx.select({
    collegeId:collegeMemberships.collegeId,userId:collegeMemberships.userId,
    status:collegeMemberships.status,
   }).from(collegeMemberships).where(eq(collegeMemberships.id,d[persona.key]))
    .limit(1);
   if(!bound||bound.collegeId!==collegeId||
      bound.userId!==manifestUsers[persona.key]||bound.status!=="ACTIVE")
    throw new Error("E2E_MEMBERSHIP_COLLISION");
   await tx.insert(membershipRoles).values({
    membershipId:d[persona.key],role:roleOf[persona.key],
    assignedByUserId:actor.user.id,
   }).onConflictDoNothing();
   const [role]=await tx.select({role:membershipRoles.role})
    .from(membershipRoles).where(and(
     eq(membershipRoles.membershipId,d[persona.key]),
     eq(membershipRoles.role,roleOf[persona.key]),
    )).limit(1);
   if(!role)throw new Error("E2E_ROLE_COLLISION");
   seeded.add(persona.key);
  }
  for(const learner of [
   {key:"learnerA" as const,program:d.programA,cohort:d.batchA,
    section:d.classA,period:periodA},
   {key:"learnerB" as const,program:d.programB,cohort:d.batchB,
    section:d.classB,period:periodB},
  ]){
   const enrollment=auxId(namespace,"enroll-"+learner.key);
   await tx.insert(learnerProgramEnrollments).values({
    id:enrollment,membershipId:d[learner.key],
    programId:learner.program,cohortId:learner.cohort,
   }).onConflictDoNothing();
   const [programEnrollment]=await tx.select({
    membershipId:learnerProgramEnrollments.membershipId,
    programId:learnerProgramEnrollments.programId,
    cohortId:learnerProgramEnrollments.cohortId,
   }).from(learnerProgramEnrollments)
    .where(eq(learnerProgramEnrollments.id,enrollment)).limit(1);
   if(!programEnrollment||
      programEnrollment.membershipId!==d[learner.key]||
      programEnrollment.programId!==learner.program||
      programEnrollment.cohortId!==learner.cohort)
    throw new Error("E2E_LEARNER_ENROLLMENT_COLLISION");
   const sectionEnrollmentId=auxId(namespace,"section-enroll-"+learner.key);
   await tx.insert(sectionEnrollments).values({
    id:sectionEnrollmentId,learnerEnrollmentId:enrollment,
    sectionId:learner.section,academicPeriodId:learner.period,
   }).onConflictDoNothing();
   const [sectionEnrollment]=await tx.select({
    learnerEnrollmentId:sectionEnrollments.learnerEnrollmentId,
    sectionId:sectionEnrollments.sectionId,
    academicPeriodId:sectionEnrollments.academicPeriodId,
   }).from(sectionEnrollments)
    .where(eq(sectionEnrollments.id,sectionEnrollmentId)).limit(1);
   if(!sectionEnrollment||
      sectionEnrollment.learnerEnrollmentId!==enrollment||
      sectionEnrollment.sectionId!==learner.section||
      sectionEnrollment.academicPeriodId!==learner.period)
    throw new Error("E2E_SECTION_ENROLLMENT_COLLISION");
  }
  for(const row of [
   {id:d.courseA,departmentId:d.deptA,name:"E2E Java Course "+namespace,
    code:code("C1"),createdByOrganizationId:d.org42Learn},
   {id:d.courseB,departmentId:d.deptB,name:"E2E Circuits Course "+namespace,
    code:code("C2"),createdByOrganizationId:d.org42Learn},
  ]){
   await tx.insert(courses).values(row).onConflictDoNothing();
   const [stored]=await tx.select({
    departmentId:courses.departmentId,code:courses.code,
    createdByOrganizationId:courses.createdByOrganizationId,
   }).from(courses).where(eq(courses.id,row.id)).limit(1);
   if(!stored||stored.departmentId!==row.departmentId||
      stored.code!==row.code||
      stored.createdByOrganizationId!==row.createdByOrganizationId)
    throw new Error("E2E_COURSE_COLLISION");
  }
  seeded.add("courseA");seeded.add("courseB");
  const curriculumA=auxId(namespace,"curriculumA");
  const curriculumB=auxId(namespace,"curriculumB");
  for(const row of [
   {id:curriculumA,programTermId:termA,courseId:d.courseA,
    type:"CORE" as const,credits:3,displayOrder:1},
   {id:curriculumB,programTermId:termB,courseId:d.courseB,
    type:"CORE" as const,credits:3,displayOrder:1},
  ]){
   await tx.insert(programTermCourses).values(row).onConflictDoNothing();
   const [stored]=await tx.select({
    programTermId:programTermCourses.programTermId,
    courseId:programTermCourses.courseId,type:programTermCourses.type,
   }).from(programTermCourses).where(eq(programTermCourses.id,row.id)).limit(1);
   if(!stored||stored.programTermId!==row.programTermId||
      stored.courseId!==row.courseId||stored.type!=="CORE")
    throw new Error("E2E_CURRICULUM_COURSE_COLLISION");
  }
  const lessonDeliveries={} as Record<"A"|"B",string>;
  for(const row of [
   {suffix:"A" as const,courseId:d.courseA,cohortId:d.batchA,
    periodId:periodA,termId:termA,curriculumId:curriculumA,
    sectionId:d.classA,facultyId:d.facultyA,
    lessonId:d.lessonA,title:"E2E Intro Java "+namespace},
   {suffix:"B" as const,courseId:d.courseB,cohortId:d.batchB,
    periodId:periodB,termId:termB,curriculumId:curriculumB,
    sectionId:d.classB,facultyId:d.facultyB,
    lessonId:d.lessonB,title:"E2E Intro Circuits "+namespace},
  ]){
   const offering=auxId(namespace,"offering"+row.suffix);
   const delivery=auxId(namespace,"delivery"+row.suffix);
   const path=auxId(namespace,"learningPath"+row.suffix);
   lessonDeliveries[row.suffix]=delivery;
   await tx.insert(courseOfferings).values({
    id:offering,courseId:row.courseId,cohortId:row.cohortId,
    academicPeriodId:row.periodId,programTermId:row.termId,
    programTermCourseId:row.curriculumId,type:"CORE",
   }).onConflictDoNothing();
   await tx.insert(courseSectionDeliveries).values({
    id:delivery,offeringId:offering,sectionId:row.sectionId,
   }).onConflictDoNothing();
   await tx.insert(courseTeachingAssignments).values({
    id:auxId(namespace,"teaching"+row.suffix),
    deliveryId:delivery,membershipId:row.facultyId,role:"PRIMARY",
   }).onConflictDoNothing();
   await tx.insert(courseLearningPaths).values({
    id:path,offeringId:offering,title:"E2E Learning Path "+row.suffix,
    status:"PUBLISHED",
   }).onConflictDoNothing();
   await tx.insert(courseLessons).values({
    id:row.lessonId,learningPathId:path,name:row.title,sequence:0,
   }).onConflictDoNothing();
   seeded.add(row.suffix==="A"?"lessonA":"lessonB");
  }
  for(const row of [
   {id:d.lectureA,lessonId:d.lessonA,deliveryId:lessonDeliveries.A,
    title:"E2E Lecture A",createdByUserId:manifestUsers.facultyA,
    sequence:0,contentType:"RESOURCE" as const,
    notes:"E2E lecture notes: introduction to Java."},
   {id:d.lectureB,lessonId:d.lessonB,deliveryId:lessonDeliveries.B,
    title:"E2E Lecture B",createdByUserId:manifestUsers.facultyB,
    sequence:0,contentType:"RESOURCE" as const,
    notes:"E2E lecture notes: introduction to circuits."},
  ])await tx.insert(lessonContents).values({
    ...row,status:"PUBLISHED",
  }).onConflictDoNothing();
  seeded.add("lectureA");seeded.add("lectureB");
  await tx.insert(lessonContents).values({
   id:d.youtubeA,lessonId:d.lessonA,deliveryId:lessonDeliveries.A,
   contentType:"YOUTUBE",title:"E2E YouTube lesson",
   externalUrl:"https://www.youtube.com/watch?v=jfKfPfyJRdk",
   durationSeconds:120,sequence:1,status:"PUBLISHED",
   createdByUserId:manifestUsers.facultyA,
  }).onConflictDoNothing();
  seeded.add("youtubeA");
  await tx.insert(courseAssignments).values({
   id:d.assignmentA,lessonId:d.lessonA,deliveryId:lessonDeliveries.A,
   title:"E2E Java assignment",maxPoints:10,sequence:0,
   dueAt:new Date("2027-06-01T12:00:00Z"),status:"PUBLISHED",
   allowedSubmissionMethods:["WRITTEN_RESPONSE"],
   createdByUserId:manifestUsers.facultyA,
  }).onConflictDoNothing();
  seeded.add("assignmentA");
  await tx.insert(assignmentSubmissions).values({
   id:d.assignmentSubmissionA,assignmentId:d.assignmentA,
   deliveryId:lessonDeliveries.A,membershipId:d.learnerA,
   submissionType:"TEXT",textContent:"E2E example submission.",
  }).onConflictDoNothing();
  seeded.add("assignmentSubmissionA");

  await tx.insert(activityEvents).values({
   id:auxId(namespace,"notification-event"),organizationId:d.orgColleges,
   collegeId:d.collegeA,actorUserId:manifestUsers.adminA,
   actorMembershipId:d.adminA,module:"COURSES",
   eventType:"e2e.fixture.notification",
   subjectType:"fixture",subjectId:d.lectureA,
   summary:"E2E course notice",
   dedupeKey:"e2e:notification:"+namespace,
  }).onConflictDoNothing();
  await tx.insert(inAppNotifications).values({
   id:d.notificationA,userId:manifestUsers.learnerA,
   eventId:auxId(namespace,"notification-event"),
   title:"E2E course notice",body:"E2E fixture message for learner A.",
   actionHref:"/learn/courses",
   deliveryStatus:"SENT",deliveredAt:new Date(),
  }).onConflictDoNothing();
  seeded.add("notificationA");
  // Course-linked discussion exists in vNext as a delivery-scoped message,
  // not the historic globally addressed course_discussion_posts table.
  await tx.insert(courseDiscussionMessages).values({
   id:d.discussionA,deliveryId:lessonDeliveries.A,
   senderMembershipId:d.learnerA,lessonContentId:d.lectureA,
   senderRole:"LEARNER",senderNameSnapshot:"E2E Learner A",
   messageText:"E2E discussion: How does Java compile?",
  }).onConflictDoNothing();
  seeded.add("discussionA");

  await tx.insert(lectureHalls).values({
   id:d.hallA,collegeId:d.collegeA,departmentId:d.deptA,
   name:"E2E Hall "+namespace,capacity:70,roomType:"LECTURE_HALL",
  }).onConflictDoNothing();
  seeded.add("hallA");
  const sessionAt=new Date("2027-01-15T09:00:00Z");
  await tx.insert(sectionScheduleEvents).values({
   id:d.classScheduleA,sectionId:d.classA,facultyMembershipId:d.facultyA,
   lectureHallId:d.hallA,title:"E2E Java session",
   startsAt:sessionAt,endsAt:new Date("2027-01-15T10:00:00Z"),
   location:"E2E Hall "+namespace,
  }).onConflictDoNothing();
  seeded.add("classScheduleA");
  await tx.insert(sectionScheduleEventCourses).values({
   scheduleEventId:d.classScheduleA,deliveryId:lessonDeliveries.A,
  }).onConflictDoNothing();
  await tx.insert(attendanceSessions).values({
   scheduleEventId:d.classScheduleA,status:"MARKED",
   markedByUserId:manifestUsers.facultyA,markedAt:sessionAt,
  }).onConflictDoNothing();
  const [attendanceInserted]=await tx.insert(attendanceRecords).values({
   id:d.attendanceA,scheduleEventId:d.classScheduleA,
   membershipId:d.learnerA,status:"PRESENT",
   markedByUserId:manifestUsers.facultyA,markedAt:sessionAt,
  }).onConflictDoNothing().returning();
  if(attendanceInserted)await appendAttendanceHistoryEvent(tx,{
   scheduleEventId:d.classScheduleA,deliveryId:lessonDeliveries.A,
   collegeId:d.collegeA,actorUserId:manifestUsers.facultyA,
   actorMembershipId:d.facultyA,actorRole:"FACULTY",
   before:null,after:attendanceInserted,
  });
  seeded.add("attendanceA");

  await tx.insert(db10Announcements).values({
   id:d.announcementA,organizationId:d.orgColleges,collegeId:d.collegeA,
   receiverType:"COLLEGE",receiverId:d.collegeA,
   title:"E2E College A announcement",
   message:"E2E isolated demo notice. This seed does not send external messages.",
   senderUserId:manifestUsers.adminA,senderType:"COLLEGE_ADMIN",
  }).onConflictDoNothing();
  seeded.add("announcementA");

  // Skills are globally searchable; namespace the canonical search key to
  // avoid taking over a real "java" catalog entry. Synonyms are permitted to
  // overlap other skills, so their deterministic UUIDs are the rerun key.
  await tx.insert(db10Skills).values({
   id:d.skillJava,name:"java-e2e-"+namespace.toLowerCase(),
   displayName:"Java (E2E "+namespace+")",category:"PROGRAMMING",
  }).onConflictDoNothing();
  seeded.add("skillJava");
  for(const row of [
   {id:d.skillSynonymJdk,skillId:d.skillJava,synonym:"jdk"},
   {id:d.skillSynonymLanguage,skillId:d.skillJava,synonym:"java language"},
  ])await tx.insert(db10SkillSynonyms).values(row).onConflictDoNothing();
  seeded.add("skillSynonymJdk");seeded.add("skillSynonymLanguage");

  await tx.insert(learnerContentProgress).values({
   id:d.youtubeProgressA,membershipId:d.learnerA,
   lessonContentId:d.youtubeA,lastPositionSeconds:30,
   durationSeconds:120,attempt:1,
  }).onConflictDoNothing();
  seeded.add("youtubeProgressA");

  // One published placement drive with an applied learner, current pipeline
  // stage and booked interview. The job is deliberately not a real recruiter
  // invitation, offer, or externally deliverable notification.
  const companyId=auxId(namespace,"company");
  const relationId=auxId(namespace,"company-relation");
  const seasonId=auxId(namespace,"placement-season");
  const optionId=auxId(namespace,"placement-role-option");
  const roundId=auxId(namespace,"placement-round");
  const stageId=auxId(namespace,"placement-application-stage");
  const interviewAt=new Date("2027-02-10T04:30:00Z");
  await tx.insert(placementCompanies).values({
   id:companyId,name:"E2E Demo Company "+namespace,
   createdByUserId:manifestUsers.adminA,
  }).onConflictDoNothing();
  await tx.insert(placementCompanyRelationships).values({
   id:relationId,collegeId:d.collegeA,companyId,
   createdByUserId:manifestUsers.adminA,
  }).onConflictDoNothing();
  await tx.insert(placementSeasons).values({
   id:seasonId,collegeId:d.collegeA,name:"E2E placements "+namespace,
   code:code("PL"),startDate:"2026-01-01",endDate:"2027-12-31",
   createdByUserId:manifestUsers.adminA,
  }).onConflictDoNothing();
  await tx.insert(placementJobs).values({
   id:d.jobA,collegeId:d.collegeA,seasonId,
   companyRelationshipId:relationId,
   title:"E2E Graduate Software Engineer",
   description:"Isolated E2E placement drive only.",
   employmentType:"FULL_TIME",workMode:"ONSITE",
   locations:["E2E Campus"],applicationMode:"INTERNAL",
   status:"PUBLISHED",publishedAt:new Date("2026-10-01T08:00:00Z"),
   applicationDeadline:new Date("2027-01-31T12:00:00Z"),
   createdByUserId:manifestUsers.adminA,
  }).onConflictDoNothing();
  seeded.add("jobA");
  await tx.insert(placementJobRoleOptions).values({
   id:optionId,jobId:d.jobA,title:"Software Engineer",
   position:0,employmentType:"FULL_TIME",workMode:"ONSITE",
   locations:["E2E Campus"],isPrimary:true,
  }).onConflictDoNothing();
  await tx.insert(placementJobRounds).values({
   id:roundId,jobId:d.jobA,sequence:1,kind:"INTERVIEW",
   name:"E2E Interview Round",mode:"ON_CAMPUS",
   scheduledAt:interviewAt,timezone:"Asia/Kolkata",
   venue:"E2E Hall "+namespace,status:"SCHEDULED",
   createdByUserId:manifestUsers.adminA,
  }).onConflictDoNothing();
  await tx.insert(placementApplications).values({
   id:d.jobApplicationA,jobId:d.jobA,
   roleOptionId:optionId,membershipId:d.learnerA,
   channel:"INTERNAL",eligibilityStatus:"ELIGIBLE",
   eligibilitySnapshot:{source:"ISOLATED_E2E_FIXTURE",sourceVersion:1},
   status:"SUBMITTED",currentRoundId:roundId,
   submittedByUserId:manifestUsers.learnerA,
  }).onConflictDoNothing();
  seeded.add("jobApplicationA");
  await tx.insert(placementCollegeApplicationStages).values({
   id:stageId,jobId:d.jobA,applicationId:d.jobApplicationA,
   stage:"INTERVIEW",previousStage:"APPLIED",
   reason:"E2E sample interview",movedByUserId:manifestUsers.adminA,
  }).onConflictDoNothing();
  await tx.insert(placementCollegeApplicationStageHistory).values({
   id:d.jobHistoryA,stageId,fromStage:"APPLIED",
   toStage:"INTERVIEW",reason:"E2E sample interview",
   actorUserId:manifestUsers.adminA,
  }).onConflictDoNothing();
  seeded.add("jobHistoryA");
  await tx.insert(placementRoundCandidateSlots).values({
   id:d.interviewA,jobId:d.jobA,roundId,
   applicationId:d.jobApplicationA,
   startsAt:interviewAt,endsAt:new Date("2027-02-10T05:00:00Z"),
   room:"E2E Hall "+namespace,status:"BOOKED",source:"TPO",
   confirmedAt:new Date("2027-01-31T12:00:00Z"),
   changedByUserId:manifestUsers.adminA,
  }).onConflictDoNothing();
  seeded.add("interviewA");

  // A project is a planned vNext project instance with a real draft
  // template/version and scoped learner+mentor memberships; old serialized
  // project_workspaces JSON is not the authoritative vNext collaboration row.
  const templateId=auxId(namespace,"project-template");
  const templateVersionId=auxId(namespace,"project-template-version");
  const blueprint=projectTemplateBlueprintSchema.parse({});
  await tx.insert(projectTemplates).values({
   id:templateId,slug:"e2e-template-"+marker.toLowerCase(),
   title:"E2E Demo Project "+namespace,status:"DRAFT",
   createdByUserId:manifestUsers.adminA,
  }).onConflictDoNothing();
  await tx.insert(projectTemplateVersions).values({
   id:templateVersionId,templateId,version:1,
   title:"E2E Demo Project "+namespace,blueprint,
   createdByUserId:manifestUsers.adminA,
  }).onConflictDoNothing();
  await tx.insert(membershipRoles).values({
   membershipId:d.facultyA,role:"MENTOR",
   assignedByUserId:actor.user.id,
  }).onConflictDoNothing();
  await tx.insert(projectInstances).values({
   id:d.projectWorkspaceA,collegeId:d.collegeA,
   templateId,templateVersionId,
   slug:manifest.projectWorkspaceASlug,
   title:"E2E College A Project",summary:"Isolated E2E planned workspace",
   status:"PLANNED",sectionId:d.classA,
   createdByUserId:manifestUsers.adminA,
  }).onConflictDoNothing();
  await tx.insert(projectMembers).values({
   id:auxId(namespace,"project-mentor"),projectId:d.projectWorkspaceA,
   membershipId:d.facultyA,role:"MENTOR",roleKind:"MENTOR",
   canMutate:true,isPrimary:true,createdByUserId:manifestUsers.adminA,
  }).onConflictDoNothing();
  await tx.insert(projectMembers).values({
   id:auxId(namespace,"project-learner"),projectId:d.projectWorkspaceA,
   membershipId:d.learnerA,role:"LEARNER",roleKind:"LEARNER",
   canMutate:false,isPrimary:false,createdByUserId:manifestUsers.adminA,
  }).onConflictDoNothing();
  seeded.add("projectWorkspaceA");

  // Legacy qualification IDs are nested profile education-entry UUIDs in
  // vNext; learner_profiles itself is membership-keyed. Its embedded entry
  // retains the exact manifest UUID, without fake identity-documents or PII.
  await tx.insert(learnerProfiles).values({
   membershipId:d.learnerA,rollNumber:code("L1"),
   profileDocument:learnerProfileDocumentSchema.parse({
    education:[{
     id:d.qualificationA,educationType:"Undergraduate",
     program:"Bachelor of Technology",specialization:"Computer Science",
     institution:"E2E College A "+namespace,startYear:"2026",
     isCurrentlyPursuing:true,isRecentEducation:true,gradingType:"CGPA",
     gradeObtained:"8.5",maxGrade:"10",
    }],
    skills:[{id:auxId(namespace,"learner-skill"),
     name:"Java",proficiency:"Intermediate"}],
   }),
  }).onConflictDoNothing();
  await tx.insert(learnerProfiles).values({
   membershipId:d.learnerB,rollNumber:code("L2"),
   profileDocument:learnerProfileDocumentSchema.parse({}),
  }).onConflictDoNothing();
  seeded.add("qualificationA");

  const ledger=buildE2EFixtureSeedLedger(manifest,seeded);
  const missing=ledger.missing;
  // Only mark nodes which this transaction actually wrote. Binary video and
  // image resources (and dependent video progress) require separate private
  // scan attestation; do not claim full fixture activation for them.
  return {
   status:ledger.status,manifest,ledger,actualUserIds:manifestUsers,
   persistedNodeCount:seeded.size,
   remainingNodeCount:missing.length,missing,
   source:"ISOLATED_TEST_DATABASE" as const,
   emailSent:false as const,mediaAttested:false as const,
  };
 });
}
