import {Pool} from "pg";
import {randomUUID} from "node:crypto";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {getOwnLearnerProfileWithRuntime} from "@/modules/people/runtime";
import {learnerProfilePublicationsAwards} from "@/modules/people/learner-profile-publications-awards-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerPlacementWriteFixture,seedLearnerPlacementWriteFixture,cleanupLearnerPlacementWriteFixture,type LearnerPlacementWriteFixture} from "../support/learner-placement-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let f:LearnerPlacementWriteFixture;
beforeEach(async()=>{
 f=newLearnerPlacementWriteFixture();await seedLearnerPlacementWriteFixture(pool,f);
 await pool.query("INSERT INTO learner_profiles(membership_id,profile_document) VALUES($1,$2::jsonb)",[
   f.ids.membership,JSON.stringify({achievements:[{id:randomUUID(),title:"Self-reported honor",year:"2025",description:""}],
     metadata:[{id:randomUUID(),key:"Publication",type:"text",value:"Self-reported paper"}]})
 ]);
},45000);
afterEach(async()=>{await pool.query("DELETE FROM learner_profiles WHERE membership_id=$1",[f.ids.membership]);await cleanupLearnerPlacementWriteFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("learner profile awards and publications from persisted private document",()=>{
 it("reads only the active learner own authored entries",async()=>{
  const read=await getOwnLearnerProfileWithRuntime(f.context);
  const records=learnerProfilePublicationsAwards(read.profile.profileDocument);
  expect(records.achievements[0]?.title).toBe("Self-reported honor");
  expect(records.publications[0]?.value).toBe("Self-reported paper");
 },30000);
 it("rejects forged college, suspended membership and wrong-role read",async()=>{
  const ctx=f.context;
  const other:RequestContext[]=[
    {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
    {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
  ];
  for(const actor of other)await expect(getOwnLearnerProfileWithRuntime(actor)).rejects.toBeDefined();
  await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[f.ids.membership]);
  try{await expect(getOwnLearnerProfileWithRuntime(ctx)).rejects.toBeDefined();}
  finally{await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[f.ids.membership]);}
 },30000);
});
