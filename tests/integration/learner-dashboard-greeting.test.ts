import {Pool} from "pg";
import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {closeDatabaseConnection} from "@/db/client";
import {getOwnLearnerPlacementGreeting} from "@/modules/placements/learner-dashboard-greeting-service";
import {learnerPlacementHeroGreeting} from "@/modules/placements/learner-dashboard-greeting-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerPlacementWriteFixture,seedLearnerPlacementWriteFixture,cleanupLearnerPlacementWriteFixture,type LearnerPlacementWriteFixture} from "../support/learner-placement-write-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let f:LearnerPlacementWriteFixture;
beforeEach(async()=>{f=newLearnerPlacementWriteFixture();await seedLearnerPlacementWriteFixture(pool,f);},45000);
afterEach(async()=>{await cleanupLearnerPlacementWriteFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();});
describe("own learner dashboard greeting",()=>{
 it("uses only current active owned display name",async()=>{
  await pool.query("UPDATE users SET display_name=$1 WHERE id=$2",["Fixture Learner",f.ids.user]);
  expect(learnerPlacementHeroGreeting(await getOwnLearnerPlacementGreeting(f.context),true))
    .toBe("Welcome to placements, Fixture Learner");
 },30000);
 it("rejects forged college, role, persisted suspension and disabled user",async()=>{
  const ctx=f.context;
  await expect(getOwnLearnerPlacementGreeting({...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}})).rejects.toBeDefined();
  await expect(getOwnLearnerPlacementGreeting({...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}})).rejects.toBeDefined();
  await pool.query("UPDATE college_memberships SET status='SUSPENDED',suspended_at=now() WHERE id=$1",[f.ids.membership]);
  await expect(getOwnLearnerPlacementGreeting(ctx)).rejects.toBeDefined();
  await pool.query("UPDATE college_memberships SET status='ACTIVE',suspended_at=NULL WHERE id=$1",[f.ids.membership]);
  await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",[f.ids.user]);
  try{await expect(getOwnLearnerPlacementGreeting(ctx)).rejects.toBeDefined();}
  finally{await pool.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1",[f.ids.user]);}
 },30000);
});
