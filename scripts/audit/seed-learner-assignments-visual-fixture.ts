/**
 * Match the old LMS All Assignments base screenshot in a disposable E2E
 * database only. Never run against real colleges or production credentials.
 */
import {eq} from "drizzle-orm";
import {getDb,closeDatabaseConnection} from "../../src/db/client";
import {
  courseLessons,courseLearningPaths,courseOfferings,courses,courseAssignments,
} from "../../src/db/schema";
import {SEED_IDS} from "../db-seed-data";

function assertDisposableE2E(){
  const source=process.env.E2E_DATABASE_URL;
  if(!source || source!==process.env.DATABASE_URL ||
      source!==process.env.TEST_DATABASE_URL) {
    throw Error("Learner visual seed requires identical E2E_DATABASE_URL, DATABASE_URL and TEST_DATABASE_URL");
  }
  const url=new URL(source);
  const name=decodeURIComponent(url.pathname.slice(1));
  if(!/^([a-z0-9_]+_e2e|e2e_[a-z0-9_]+)$/i.test(name)||
    !["localhost","127.0.0.1"].includes(url.hostname)) {
    throw Error("Refusing Learner fixture write outside local disposable E2E DB");
  }
}
async function main(){
  assertDisposableE2E();
  const db=getDb();
  const lessons=await db.select({
    lessonId:courseLessons.id,
    courseId:courses.id,
  }).from(courseLessons)
    .innerJoin(courseLearningPaths,eq(courseLearningPaths.id,courseLessons.learningPathId))
    .innerJoin(courseOfferings,eq(courseOfferings.id,courseLearningPaths.offeringId))
    .innerJoin(courses,eq(courses.id,courseOfferings.courseId))
    .where(eq(courseLessons.name,"E2E Foundations")).limit(1);
  const lesson=lessons[0];
  if(!lesson)throw Error("Expected E2E Foundations lesson missing");
  await db.update(courses).set({name:"Java Programming"})
    .where(eq(courses.id,lesson.courseId));
  await db.insert(courseAssignments).values({
    id:"76000000-0000-4000-8000-000000000021",
    lessonId:lesson.lessonId,
    deliveryId:null,
    title:"Introduction to Java",
    description:"Legacy screenshot comparison fixture only",
    dueAt:new Date("2026-07-15T03:41:00.000Z"),
    maxPoints:10,
    sequence:5,
    status:"PUBLISHED",
    createdByUserId:SEED_IDS.collegeAdminUser,
    createdAt:new Date("2026-06-30T05:30:00.000Z"),
  }).onConflictDoNothing();
  process.stdout.write("Safe Learner baseline fixture: published Java assignment in disposable E2E database.\n");
}
main().catch(error=>{
  process.stderr.write(String(error?.stack??error)+"\n");
  process.exitCode=1;
}).finally(()=>closeDatabaseConnection());
