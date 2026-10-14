import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { applyToPlacementJob } from "@/modules/placements/application-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { newLearnerPositiveFixture,seedLearnerPositiveFixture,cleanupLearnerPositiveFixture } from "../support/learner-positive-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:ReturnType<typeof newLearnerPositiveFixture>|null=null;
beforeEach(async()=>{fixture=newLearnerPositiveFixture();await seedLearnerPositiveFixture(pool,fixture);},45000);
afterEach(async()=>{if(fixture){const owned=fixture;fixture=null;await cleanupLearnerPositiveFixture(pool,owned);}},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner drive apply existing-application idempotence, PostgreSQL",()=>{
  it("returns only own already-submitted application without a duplicate write",async()=>{
    const {ids,context}=fixture!;
    const result=await applyToPlacementJob(context,ids.job,{roleOptionId:ids.jobRole});
    expect(result).toMatchObject({id:ids.application,membershipId:ids.membership,status:"SUBMITTED"});
    const rows=await pool.query<{total:string}>("SELECT count(*)::text AS total FROM placement_applications WHERE membership_id=$1 AND role_option_id=$2",[ids.membership,ids.jobRole]);
    expect(rows.rows[0]?.total).toBe("1");
  });
  it("rejects forged college, suspended membership, wrong-role and signed-in actor",async()=>{
    const {ids,context}=fixture!;
    const denied:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
      {...context,user:{...context.user,id:SEED_IDS.facultyUser}},
    ];
    for(const actor of denied)await expect(applyToPlacementJob(actor,ids.job,{roleOptionId:ids.jobRole})).rejects.toBeDefined();
    const rows=await pool.query<{total:string}>("SELECT count(*)::text AS total FROM placement_applications WHERE membership_id=$1",[ids.membership]);
    expect(rows.rows[0]?.total).toBe("1");
  });
});