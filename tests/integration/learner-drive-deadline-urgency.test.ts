import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {listLearnerPlacementJobs} from "@/modules/placements/learner-job-service";
import {learnerDriveDeadlineUrgency} from "@/modules/placements/learner-drive-deadline-urgency-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerDriveReadFixture,seedLearnerDriveReadFixture,cleanupLearnerDriveReadFixture,
type LearnerDriveReadFixture} from "../support/learner-drive-read-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerDriveReadFixture|null=null;
beforeEach(async()=>{fixture=newLearnerDriveReadFixture();await seedLearnerDriveReadFixture(pool,fixture);},45000);
afterEach(async()=>{const f=fixture;fixture=null;if(f)await cleanupLearnerDriveReadFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L12-017 own published drive deadline urgency",()=>{
 it("classifies real persisted deadlines without inventing applications",async()=>{
  const f=fixture!;
  const result=await listLearnerPlacementJobs(f.learner.context,new Date("2026-10-14T12:00:00Z"));
  const serialized=JSON.parse(JSON.stringify(result)) as Array<{
    job:{id:string;applicationDeadline:string|null};deadlinePassed:boolean;
  }>;
  const older=serialized.find(row=>row.job.id===f.ids.olderJob);
  const newer=serialized.find(row=>row.job.id===f.ids.newerJob);
  expect(older).toBeDefined();expect(newer).toBeDefined();
  expect(learnerDriveDeadlineUrgency(older!.job.applicationDeadline,older!.deadlinePassed,
    "2026-10-14T12:00:00Z").kind).toBe("soon");
  expect(learnerDriveDeadlineUrgency(newer!.job.applicationDeadline,newer!.deadlinePassed,
    "2026-10-14T12:00:00Z").kind).toBe("soon");
 },30000);
 it("denies foreign college, suspended membership, wrong role",async()=>{
  const ctx=fixture!.learner.context;
  const invalid:RequestContext[]=[
    {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
    {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
    {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
  ];
  for(const actor of invalid)await expect(listLearnerPlacementJobs(actor)).rejects.toBeDefined();
 },30000);
});