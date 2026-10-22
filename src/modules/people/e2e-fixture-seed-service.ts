import "server-only";

import {createHash} from "node:crypto";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {
 academicPeriods,activityEvents,assignmentSubmissions,collegeMemberships,
 colleges,cohorts,courseAssignments,courseLearningPaths,courseLessons,
 courseOfferings,courseSectionDeliveries,courseTeachingAssignments,courses,
 departments,inAppNotifications,learnerProgramEnrollments,lessonContents,
 membershipRoles,organizations,programs,sectionEnrollments,sections,
 systemRoles,users,
} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {
 buildE2EFixtureManifest,type E2EFixtureKey,
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
    process.env.APP_ENV!=="test"||
    process.env.E2E_SEED_ENABLED!=="true"||
    process.env.E2E_ISOLATED_DATABASE!=="true"||
    process.env.E2E_ALLOW_GRAPH_WRITES!=="true"||
    process.env.APP_E2E_SEED_ENABLED!=="true")
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
 namespace=process.env.E2E_FIXTURE_NAMESPACE||"e2e-dev",
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
   (await import("drizzle-orm")).sql`select pg_advisory_xact_lock(hashtextextended(${"e2e:"+namespace},0))`
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
  }
  seeded.add("orgColleges");seeded.add("org42Learn");
  for(const row of [
   {id:d.collegeA,organizationId:d.orgColleges,
    name:"E2E College A "+namespace,code:code("CA")},
   {id:d.collegeB,organizationId:d.orgColleges,
    name:"E2E College B "+namespace,code:code("CB")},
  ])await tx.insert(colleges).values(row).onConflictDoNothing();
  seeded.add("collegeA");seeded.add("collegeB");
  for(const row of [
   {id:d.deptA,collegeId:d.collegeA,name:"E2E Computer Science "+namespace},
   {id:d.deptB,collegeId:d.collegeB,name:"E2E Electronics "+namespace},
  ])await tx.insert(departments).values(row).onConflictDoNothing();
  seeded.add("deptA");seeded.add("deptB");
  for(const row of [
   {id:d.programA,departmentId:d.deptA,name:"E2E BTech CS "+namespace,
    code:code("PA"),durationTerms:8},
   {id:d.programB,departmentId:d.deptB,name:"E2E BTech EC "+namespace,
    code:code("PB"),durationTerms:8},
  ])await tx.insert(programs).values(row).onConflictDoNothing();
  seeded.add("programA");seeded.add("programB");

  const periodA=auxId(namespace,"periodA"),periodB=auxId(namespace,"periodB");
  for(const row of [
   {id:periodA,collegeId:d.collegeA,name:"E2E 2026-27 "+namespace,
    code:code("AY1"),startDate:"2026-01-01",endDate:"2027-12-31",
    status:"ACTIVE" as const},
   {id:periodB,collegeId:d.collegeB,name:"E2E 2026-27 "+namespace,
    code:code("AY2"),startDate:"2026-01-01",endDate:"2027-12-31",
    status:"ACTIVE" as const},
  ])await tx.insert(academicPeriods).values(row).onConflictDoNothing();
  for(const row of [
   {id:d.batchA,programId:d.programA,name:"E2E Batch A "+namespace,
    code:code("BA"),startPeriodId:periodA,status:"ACTIVE" as const},
   {id:d.batchB,programId:d.programB,name:"E2E Batch B "+namespace,
    code:code("BB"),startPeriodId:periodB,status:"ACTIVE" as const},
  ])await tx.insert(cohorts).values(row).onConflictDoNothing();
  seeded.add("batchA");seeded.add("batchB");
  for(const row of [
   {id:d.classA,cohortId:d.batchA,academicPeriodId:periodA,
    name:"E2E Section A "+namespace,code:code("SA")},
   {id:d.classB,cohortId:d.batchB,academicPeriodId:periodB,
    name:"E2E Section B "+namespace,code:code("SB")},
  ])await tx.insert(sections).values(row).onConflictDoNothing();
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
   await tx.insert(sectionEnrollments).values({
    id:auxId(namespace,"section-enroll-"+learner.key),
    learnerEnrollmentId:enrollment,sectionId:learner.section,
    academicPeriodId:learner.period,
   }).onConflictDoNothing();
  }
  for(const row of [
   {id:d.courseA,departmentId:d.deptA,name:"E2E Java Course "+namespace,
    code:code("C1"),createdByOrganizationId:d.org42Learn},
   {id:d.courseB,departmentId:d.deptB,name:"E2E Circuits Course "+namespace,
    code:code("C2"),createdByOrganizationId:d.org42Learn},
  ])await tx.insert(courses).values(row).onConflictDoNothing();
  seeded.add("courseA");seeded.add("courseB");
  const lessonDeliveries={} as Record<"A"|"B",string>;
  for(const row of [
   {suffix:"A" as const,courseId:d.courseA,cohortId:d.batchA,
    periodId:periodA,sectionId:d.classA,facultyId:d.facultyA,
    lessonId:d.lessonA,title:"E2E Intro Java "+namespace},
   {suffix:"B" as const,courseId:d.courseB,cohortId:d.batchB,
    periodId:periodB,sectionId:d.classB,facultyId:d.facultyB,
    lessonId:d.lessonB,title:"E2E Intro Circuits "+namespace},
  ]){
   const offering=auxId(namespace,"offering"+row.suffix);
   const delivery=auxId(namespace,"delivery"+row.suffix);
   const path=auxId(namespace,"learningPath"+row.suffix);
   lessonDeliveries[row.suffix]=delivery;
   await tx.insert(courseOfferings).values({
    id:offering,courseId:row.courseId,cohortId:row.cohortId,
    academicPeriodId:row.periodId,
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
  const missing=manifest.nodes
   .filter(node=>!seeded.has(node.key))
   .map(node=>({key:node.key,requires:node.requires,
     reason:node.externalBinaryRequired?"PRIVATE_SCANNED_UPLOAD_REQUIRED":
      "DOMAIN_WRITER_REQUIRED"}));
  // Do not report success for the unseeded placements, calendar, video, image
  // and project workspace. This response is an actual partial DB seed, not
  // the speculative fixture manifest treated as a persisted graph.
  return {
   status:"PARTIAL" as const,manifest,actualUserIds:manifestUsers,
   persistedNodeCount:seeded.size,
   remainingNodeCount:missing.length,missing,
   source:"ISOLATED_TEST_DATABASE" as const,
   emailSent:false as const,mediaAttested:false as const,
  };
 });
}
