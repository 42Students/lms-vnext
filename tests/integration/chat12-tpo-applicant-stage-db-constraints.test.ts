import {afterAll,beforeAll,describe,expect,it} from "vitest";
import type {Pool} from "pg";
import {
 newHarnessPool,withProjectPg,createTenant,createPrincipal,createPlacementFixture,
 createPlacementCandidateFixture,
} from "./support/projects-placements-pg-harness";

let pool:Pool;
beforeAll(()=>{pool=newHarnessPool();});
afterAll(async()=>{if(pool)await pool.end();});

/** Registered table invariants; fixtures and writes ALWAYS roll back. This is
 * real SQL constraint coverage, not a simulated stage-transition service. */
describe("PROJ-BREAK-TPO-10 PostgreSQL applicant-stage integrity",()=>{
 it("rejects conflicting stages, invalid values and unrelated college/job foreign keys",async()=>{
  await withProjectPg(pool,async db=>{
   const own=await createTenant(db,"TPO stage verification");
   const other=await createTenant(db,"Foreign TPO stage tenant");
   const author=await createPrincipal(db,own,["TPO"]);
   const learner=await createPrincipal(db,own,["LEARNER"]);
   const otherAuthor=await createPrincipal(db,other,["TPO"]);
   const ownDrive=await createPlacementFixture(db,own,author);
   const foreignDrive=await createPlacementFixture(db,other,otherAuthor);
   const candidate=await createPlacementCandidateFixture(db,ownDrive,learner,author);
   const values=[candidate.applicationId,ownDrive.jobId,ownDrive.roundId,author.userId];
   const insert=`
    insert into placement_tpo_application_stages
      (application_id,job_id,round_id,changed_by_user_id,stage,version)
    values ($1,$2,$3,$4,'TEST',1)`;
   await db.query(insert,values);
   await db.expectSqlState(()=>db.query(insert,values),"23505");
   await db.expectSqlState(()=>db.query(`
     insert into placement_tpo_application_stages
       (application_id,job_id,round_id,changed_by_user_id,stage,version)
     values ($1,$2,$3,$4,'INTERVIEW',1)`,
     [candidate.applicationId,foreignDrive.jobId,foreignDrive.roundId,author.userId]),"23505");
   await db.expectSqlState(()=>db.query(`
     update placement_tpo_application_stages set stage='GRADUATED'
     where application_id=$1`,[candidate.applicationId]),"23514");
   await db.expectSqlState(()=>db.query(`
     update placement_tpo_application_stages set version=0
     where application_id=$1`,[candidate.applicationId]),"23514");
   const updated=await db.query<{version:number;stage:string}>(`
    update placement_tpo_application_stages set stage='INTERVIEW',version=version+1
    where application_id=$1 and version=1
    returning version,stage`,[candidate.applicationId]);
   expect(updated).toEqual([{version:2,stage:"INTERVIEW"}]);
   const stale=await db.query(`
    update placement_tpo_application_stages set stage='TEST',version=version+1
    where application_id=$1 and version=1 returning version`,[candidate.applicationId]);
   expect(stale).toEqual([]);
  });
 });
});
