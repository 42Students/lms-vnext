import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getOwnLearnerPlacementPreparation } from "@/modules/placements/learner-preparation-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import {
  newLearnerPositiveFixture, seedLearnerPositiveFixture,
  cleanupLearnerPositiveFixture,
} from "../support/learner-positive-fixture";

if(!process.env.TEST_DATABASE_URL) {
  throw new Error("Learner preparation requires disposable TEST_DATABASE_URL");
}
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
const fixture=newLearnerPositiveFixture();
let initialized=false;
beforeAll(async()=>{
  initialized=true;
  await seedLearnerPositiveFixture(pool,fixture);
},45_000);
afterAll(async()=>{
  try {
    if(initialized) await cleanupLearnerPositiveFixture(pool,fixture);
  } finally {
    await pool.end();
    await closeDatabaseConnection();
  }
},45_000);

describe("Own Learner preparation facts against disposable PostgreSQL",()=>{
  it("reads exactly its own registered enrollment, profile and application history",async()=>{
    const data=await getOwnLearnerPlacementPreparation(fixture.context,{view:"ALL"});
    expect(data).toMatchObject({
      total:4,applicationCount:1,
    });
    expect(data.items.find(item=>item.id==="enrollment")).toMatchObject({recorded:true});
    expect(data.items.find(item=>item.id==="applications")).toMatchObject({recorded:true});
    // The fixture has no optional self-profile email, contact or saved skills.
    expect(data.items.find(item=>item.id==="skills")).toMatchObject({recorded:false});
    expect(data.items.every(item=>item.href.startsWith("/learn/"))).toBe(true);
    const missing=await getOwnLearnerPlacementPreparation(fixture.context,{view:"MISSING"});
    expect(missing.total).toBe(4);
    expect(missing.items.every(item=>!item.recorded)).toBe(true);
  });
  it("rejects forged-college, suspended and wrong-role contexts",async()=>{
    const context=fixture.context;
    const denied:RequestContext[]=[
      {...context,membership:{...context.membership!,collegeId:SEED_IDS.collegeB}},
      {...context,membership:{...context.membership!,status:"SUSPENDED"}},
      {...context,membership:{...context.membership!,roles:["FACULTY"]}},
      {...context,user:{...context.user,platformStatus:"DISABLED"}},
      {...context,user:{...context.user,id:SEED_IDS.facultyUser}},
    ];
    for(const invalid of denied){
      await expect(getOwnLearnerPlacementPreparation(invalid,{}))
        .rejects.toBeInstanceOf(AuthorizationError);
    }
  });
  it("denies caller-driven membership/college scope injection",async()=>{
    await expect(getOwnLearnerPlacementPreparation(fixture.context,{
      collegeId:SEED_IDS.collegeB,
    })).rejects.toBeDefined();
    await expect(getOwnLearnerPlacementPreparation(fixture.context,{
      membershipId:SEED_IDS.learnerCollegeAMembership,
    })).rejects.toBeDefined();
  });
});
