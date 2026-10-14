import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {getOwnLearnerProfileWithRuntime} from "@/modules/people/runtime";
import {requireOwnLearnerProfileAccess} from "@/modules/people/learner-profile-access-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerPlacementWriteFixture,seedLearnerPlacementWriteFixture,cleanupLearnerPlacementWriteFixture,type LearnerPlacementWriteFixture} from "../support/learner-placement-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerPlacementWriteFixture;
beforeEach(async()=>{
  fixture=newLearnerPlacementWriteFixture();await seedLearnerPlacementWriteFixture(pool,fixture);
  await pool.query("INSERT INTO learner_profiles(membership_id,profile_document) VALUES($1,$2::jsonb)",[fixture.ids.membership,JSON.stringify({headline:"Own saved headline"})]);
},45000);
afterEach(async()=>{
  await pool.query("DELETE FROM learner_profiles WHERE membership_id=$1",[fixture.ids.membership]);
  await cleanupLearnerPlacementWriteFixture(pool,fixture);
},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("live own learner profile read before recovery UI",()=>{
  it("returns the persisted own profile after active role and tenant check",async()=>{
    expect((await getOwnLearnerProfileWithRuntime(fixture.context)).profile.profileDocument.headline).toBe("Own saved headline");
    expect((await requireOwnLearnerProfileAccess(fixture.context)).id).toBe(fixture.ids.membership);
  },30000);
  it("denies forged college, forged actor and wrong role before exposing private document",async()=>{
    const ctx=fixture.context;
    for(const actor of [
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,user:{...ctx.user,id:SEED_IDS.collegeAdminUser}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY" as const]}},
    ])await expect(getOwnLearnerProfileWithRuntime(actor)).rejects.toMatchObject({name:"AuthorizationError"});
  },30000);
  it("denies stale ACTIVE context after persisted suspension, platform disable or role revocation",async()=>{
    await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[fixture.ids.membership]);
    await expect(getOwnLearnerProfileWithRuntime(fixture.context)).rejects.toMatchObject({name:"AuthorizationError"});
    await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[fixture.ids.membership]);
    await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",[fixture.ids.user]);
    await expect(getOwnLearnerProfileWithRuntime(fixture.context)).rejects.toMatchObject({name:"AuthorizationError"});
    await pool.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1",[fixture.ids.user]);
    await pool.query("DELETE FROM membership_roles WHERE id=$1",[fixture.ids.role]);
    await expect(getOwnLearnerProfileWithRuntime(fixture.context)).rejects.toMatchObject({name:"AuthorizationError"});
  },30000);
});
