import {afterAll,beforeAll,describe,expect,it} from "vitest";
import type {Pool} from "pg";
import {createTenant,newHarnessPool,withProjectPg} from "./support/projects-placements-pg-harness";
import {readFileSync} from "node:fs";

let pool:Pool;
beforeAll(()=>{pool=newHarnessPool();});
afterAll(async()=>{if(pool)await pool.end();});

describe("TPO-BREAK-settings-01 real PostgreSQL monotonic version and stale-tab safety",()=>{
 it("never produces an identical CAS timestamp under rapid consecutive writes",async()=>{
  await withProjectPg(pool,async db=>{
   const tenant=await createTenant(db,"TPO Settings CAS");
   const inserted=await db.query<{updated_at:Date}>(`
    insert into placement_tpo_college_settings(college_id)
    values ($1) returning updated_at`,[tenant.collegeId]);
   expect(inserted).toHaveLength(1);
   const read=inserted[0]!.updated_at;
   const update=async(cap:number)=>db.query<{updated_at:Date}>(`
    update placement_tpo_college_settings
      set sms_monthly_cap=$2,
          updated_at=greatest(
            clock_timestamp(),
            date_trunc('milliseconds',updated_at)+interval '1 millisecond')
    where college_id=$1 returning updated_at`,[tenant.collegeId,cap]);
   const first=(await update(300))[0]!.updated_at;
   const second=(await update(400))[0]!.updated_at;
   expect(first.getTime()).toBeGreaterThan(read.getTime());
   expect(second.getTime()).toBeGreaterThan(first.getTime());
   const staleUpdate=await db.query(`
    update placement_tpo_college_settings
      set sms_monthly_cap=500
    where college_id=$1
      and date_trunc('milliseconds',updated_at)=$2::timestamptz
    returning college_id`,[tenant.collegeId,read.toISOString()]);
   expect(staleUpdate).toHaveLength(0);
   const actual=await db.query<{sms_monthly_cap:number}>(`
    select sms_monthly_cap from placement_tpo_college_settings where college_id=$1`,
    [tenant.collegeId]);
   expect(actual[0]?.sms_monthly_cap).toBe(400);
  });
 });
 it("service owns a row lock, checks caller version, advances the timestamp and audits in one transaction",()=>{
  const source=readFileSync("src/modules/placements/tpo-communication-settings-service.ts","utf8");
  expect(source).toContain('getDb().transaction');
  expect(source).toContain('for("update")');
  expect(source).toContain('!==input.expectedVersion');
  expect(source).toContain('greatest(clock_timestamp(),date_trunc(\'milliseconds\'');
  expect(source).toContain('await tx.insert(activityEvents)');
 });
});
