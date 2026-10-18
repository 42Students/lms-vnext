import {afterAll,beforeAll,describe,expect,it} from "vitest";
import type {Pool} from "pg";
import {
 newHarnessPool,withProjectPg,createTenant,createPrincipal,createPlacementFixture,
} from "./support/projects-placements-pg-harness";

let pool:Pool;
beforeAll(()=>{pool=newHarnessPool();});
afterAll(async()=>{await pool?.end();});

describe("HR-TODAY-CHANGE-56 PostgreSQL scope, lifecycle and tenant invariants",()=>{
 it("returns only current own-college COMPANY questions; archiving invalidates prior allowlist",async()=>{
  await withProjectPg(pool,async db=>{
   const ownCollege=await createTenant(db,"HR change own college");
   const otherCollege=await createTenant(db,"HR change other college");
   const tpoOwn=await createPrincipal(db,ownCollege,["TPO"]);
   const tpoOther=await createPrincipal(db,otherCollege,["TPO"]);
   const own=await createPlacementFixture(db,ownCollege,tpoOwn);
   const foreign=await createPlacementFixture(db,otherCollege,tpoOther);
   for(const [jobId,actor] of [[own.jobId,tpoOwn.userId],[foreign.jobId,tpoOther.userId]]){
    await db.query(`update placement_jobs
      set status='PUBLISHED',published_at=clock_timestamp(),
          application_deadline=$2,minimum_annual_ctc_inr=600000,
          maximum_annual_ctc_inr=800000
      where id=$1`,[jobId,new Date("2099-12-31T00:00:00.000Z")]);
    await db.query(`insert into placement_drive_change_requests
      (job_id,created_by_user_id,proposer_party,target_party,mode,field,proposed_value,reason)
      values ($1,$2,'TPO','COMPANY','ASK','OTHER',
        'Please confirm this request','Coordinate employer scheduling')`,[jobId,actor]);
   }
   // This is the persisted scope used by BOTH HR Today request readers,
   // not a trust of the previous-page allowlist or cached recruiter grant.
   const visible=async()=>db.query<{job_id:string}>(`
     select cr.job_id
       from placement_drive_change_requests cr
       join placement_jobs j on j.id=cr.job_id
      where cr.job_id=any($1::uuid[])
        and j.college_id=$2
        and j.status in ('PUBLISHED','CLOSED')
        and j.archived_at is null
        and cr.status='OPEN' and cr.target_party='COMPANY'
      order by cr.created_at desc`,
    [[own.jobId,foreign.jobId],ownCollege.collegeId]);

   expect((await visible()).map(row=>row.job_id)).toEqual([own.jobId]);
   await db.savepoint(async()=>{
    await db.query(`update placement_jobs set status='CLOSED',
      closed_at=clock_timestamp() where id=$1`,[own.jobId]);
    expect((await visible()).map(row=>row.job_id)).toEqual([own.jobId]);
   },true);
   await db.savepoint(async()=>{
    await db.query(`update placement_jobs set status='ARCHIVED',
      archived_at=clock_timestamp() where id=$1`,[own.jobId]);
    expect(await visible()).toEqual([]);
   },true);
   await db.savepoint(async()=>{
    await db.query(`update placement_drive_change_requests
      set status='ANSWERED',decided_at=clock_timestamp(),
          decided_by_user_id=$2 where job_id=$1`,[own.jobId,tpoOwn.userId]);
    expect(await visible()).toEqual([]);
   },true);
   expect((await visible()).map(row=>row.job_id)).toEqual([own.jobId]);
  });
 });
});
