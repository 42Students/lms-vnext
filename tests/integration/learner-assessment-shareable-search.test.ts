import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getOwnLearnerAssessmentBrowse} from "@/modules/placements/learner-assessment-browse-service";
import {browseLearnerCareerRounds,type LearnerRoundBrowseSource,type LearnerRoundBrowseFilters}
  from "@/modules/placements/learner-rounds-browse-model";
import {learnerRoundSearchFromQuery} from "@/modules/placements/learner-round-search-query-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerAssessmentBrowseFixture,seedLearnerAssessmentBrowseFixture,
  cleanupLearnerAssessmentBrowseFixture,type LearnerAssessmentBrowseFixture}
  from "../support/learner-assessment-browse-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerAssessmentBrowseFixture|null=null;
beforeEach(async()=>{fixture=newLearnerAssessmentBrowseFixture();await seedLearnerAssessmentBrowseFixture(pool,fixture);},45000);
afterEach(async()=>{const own=fixture;fixture=null;if(own)await cleanupLearnerAssessmentBrowseFixture(pool,own);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
const filters:LearnerRoundBrowseFilters={search:"",time:"all",urgency:"all",sort:"soonest"};
describe("L15-003 own persisted assessment search",()=>{
  it("searches only authorized TEST rounds without caller membership filters",async()=>{
    const f=fixture!;
    const persisted=await getOwnLearnerAssessmentBrowse(f.drive.learner.context);
    const rows=JSON.parse(JSON.stringify(persisted.rounds)) as LearnerRoundBrowseSource[];
    const own=browseLearnerCareerRounds(rows,"ASSESSMENT",{
      ...filters,search:learnerRoundSearchFromQuery({q:"searchable assessment"}),
    },Date.parse("2026-10-14T00:00:00Z"));
    expect(own.map(x=>x.roundId)).toContain(f.roundId);
    expect(browseLearnerCareerRounds(rows,"ASSESSMENT",{...filters,search:"not found"},
      Date.parse("2026-10-14T00:00:00Z"))).toHaveLength(0);
  },30000);
  it("rejects cross-college, suspended and wrong-role principals",async()=>{
    const ctx=fixture!.drive.learner.context;
    const bad:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of bad)await expect(getOwnLearnerAssessmentBrowse(actor)).rejects.toBeDefined();
  },30000);
});
