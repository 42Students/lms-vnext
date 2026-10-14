import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {browseLearnerCareerRounds,type LearnerRoundBrowseSource,
  type LearnerRoundBrowseFilters} from "@/modules/placements/learner-rounds-browse-model";
import {learnerRoundSearchFromQuery} from "@/modules/placements/learner-round-search-query-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
  cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
  from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCareerCalendarFixture|null=null;
beforeEach(async()=>{fixture=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,fixture);},45000);
afterEach(async()=>{const f=fixture;fixture=null;if(f)await cleanupLearnerCareerCalendarFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
const filters:LearnerRoundBrowseFilters={search:"",time:"all",urgency:"all",sort:"soonest"};
describe("L16-003 interview own persisted searchable round",()=>{
  it("searches authorized shortlisted interview only from persisted round names",async()=>{
    const f=fixture!;
    const workspace=await getLearnerPlacementRequestWorkspace(f.drive.learner.context);
    const rounds=JSON.parse(JSON.stringify(workspace.rounds)) as LearnerRoundBrowseSource[];
    const found=browseLearnerCareerRounds(rounds,"INTERVIEW",{
      ...filters,search:learnerRoundSearchFromQuery({q:"Owned interview"}),
    },Date.parse("2026-10-14T00:00:00Z"));
    expect(found.map(row=>row.roundId)).toContain(f.roundId);
    expect(browseLearnerCareerRounds(rounds,"INTERVIEW",{...filters,search:"not-this-employer"},
      Date.parse("2026-10-14T00:00:00Z"))).toHaveLength(0);
  },30000);
  it("denies forged college, suspended and wrong-role identities",async()=>{
    const ctx=fixture!.drive.learner.context;
    const denied:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of denied)await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
  },30000);
});
