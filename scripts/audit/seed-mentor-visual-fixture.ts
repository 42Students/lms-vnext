/**
 * Optional, throwaway visual-only fixture for the old /mentor/calendar screenshot.
 * Run ONLY after db:e2e:prepare on its disposable PostgreSQL instance.
 *
 * The reference capture has one REQUESTED and one COMPLETED meeting. The
 * normal E2E mentor seed has none, so comparing those two screens is a false
 * visual difference. This fixture does not mock permissions or bypass APIs.
 */
import {eq} from "drizzle-orm";
import {getDb,closeDatabaseConnection} from "../../src/db/client";
import {projectInstances,projectMeetings,projectSprints} from "../../src/db/schema";
import {SEED_IDS} from "../db-seed-data";

function assertDisposableDatabase(){
  const source=process.env.E2E_DATABASE_URL;
  if(!source || source!==process.env.DATABASE_URL ||
      source!==process.env.TEST_DATABASE_URL) {
    throw Error("Mentor visual seed requires identical E2E_DATABASE_URL, DATABASE_URL and TEST_DATABASE_URL");
  }
  const url=new URL(source);
  const name=decodeURIComponent(url.pathname.slice(1));
  if(!/^([a-z0-9_]+_e2e|e2e_[a-z0-9_]+)$/i.test(name) ||
      !["127.0.0.1","localhost"].includes(url.hostname)){
    throw Error("Refusing visual fixtures outside local disposable E2E database");
  }
}
async function main(){
  assertDisposableDatabase();
  if(process.env.MENTOR_E2E_SEED_PROJECT!=="true"){
    throw Error("MENTOR_E2E_SEED_PROJECT=true required");
  }
  const db=getDb();
  const matches=await db.select({id:projectInstances.id})
    .from(projectInstances)
    .where(eq(projectInstances.slug,"mentor-acceptance-e2e-project"))
    .limit(1);
  const project=matches[0];
  if(!project)throw Error("Expected actual seeded Mentor project was not found");

  await db.update(projectInstances).set({
    title:"Alternative Data Underwriting",
  }).where(eq(projectInstances.id,project.id));
  const sprints=await db.select({id:projectSprints.id})
    .from(projectSprints).where(eq(projectSprints.projectId,project.id)).limit(1);
  const linkedSprintId=sprints[0]?.id??null;
  if(linkedSprintId){
    await db.update(projectSprints).set({
      title:"Security hardening and pilot",
    }).where(eq(projectSprints.id,linkedSprintId));
  }
  const rows=[
    {
      id:"76000000-0000-4000-8000-000000000011",
      projectId:project.id,meetingKey:"legacy-parity-requested",
      title:"87g",status:"REQUESTED",
      meetingType:"GENERAL",startsAt:new Date("2026-10-24T10:30:00.000Z"),
      endsAt:new Date("2026-10-24T12:30:00.000Z"),
      timeZone:"Asia/Kolkata",
      requestedByMembershipId:SEED_IDS.learnerCollegeAMembership,
      createdByUserId:SEED_IDS.collegeAdminUser,
    },
    {
      id:"76000000-0000-4000-8000-000000000012",
      projectId:project.id,meetingKey:"legacy-parity-completed",
      title:"Sprint 46 Review & Retrospective",status:"COMPLETED",
      meetingType:"REVIEW",startsAt:new Date("2026-08-25T04:30:00.000Z"),
      endsAt:new Date("2026-08-25T05:15:00.000Z"),
      timeZone:"Asia/Kolkata",
      linkedSprintId,createdByUserId:SEED_IDS.collegeAdminUser,
    },
  ];
  await db.insert(projectMeetings).values(rows).onConflictDoNothing();
  process.stdout.write("Safe Mentor baseline fixture: two real project meetings persisted in disposable E2E DB.\n");
}
main().catch(error=>{
  process.stderr.write(String(error?.stack??error)+"\n");
  process.exitCode=1;
}).finally(()=>closeDatabaseConnection());
