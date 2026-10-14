import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getOwnLearnerProfileWithRuntime} from "@/modules/people/runtime";
import {learnerProfileChecklist} from "@/modules/people/learner-profile-checklist";
import {learnerProfileMobileQuickLinks} from "@/modules/people/learner-profile-mobile-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerPlacementWriteFixture,seedLearnerPlacementWriteFixture,cleanupLearnerPlacementWriteFixture,type LearnerPlacementWriteFixture} from "../support/learner-placement-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerPlacementWriteFixture;
beforeEach(async()=>{
 fixture=newLearnerPlacementWriteFixture();await seedLearnerPlacementWriteFixture(pool,fixture);
 await pool.query("INSERT INTO learner_profiles(membership_id,profile_document) VALUES($1,$2::jsonb)",[
  fixture.ids.membership,JSON.stringify({headline:"Own existing headline"})]);
},45000);
afterEach(async()=>{await pool.query("DELETE FROM learner_profiles WHERE membership_id=$1",[fixture.ids.membership]);await cleanupLearnerPlacementWriteFixture(pool,fixture);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("mobile profile sections from persisted own document",()=>{
 it("does not suggest editing an already authored introduction",async()=>{
  const record=await getOwnLearnerProfileWithRuntime(fixture.context);
  const links=learnerProfileMobileQuickLinks(learnerProfileChecklist(record.profile.profileDocument).items);
  expect(links.some(x=>x.section==="profile-introduction")).toBe(false);
  expect(links[0]?.section).toBe("education");
 },30000);
 it("denies forged college, wrong-role and suspended profile source reads",async()=>{
  const ctx=fixture.context;
  const invalid:RequestContext[]=[
    {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
    {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
  ];
  for(const actor of invalid)await expect(getOwnLearnerProfileWithRuntime(actor)).rejects.toBeDefined();
  await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[fixture.ids.membership]);
  try{await expect(getOwnLearnerProfileWithRuntime(ctx)).rejects.toBeDefined();}
  finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[fixture.ids.membership]);}
 },30000);
});
