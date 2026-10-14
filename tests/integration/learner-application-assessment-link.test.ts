import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementRequestWorkspace} from "@/modules/placements/request-service";
import {ownApplicationAssessmentLinks} from "@/modules/placements/learner-application-assessment-links-model";
import {resolveOwnAssessmentDeepLink} from "@/modules/placements/learner-assessment-deeplink-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerAssessmentBrowseFixture,seedLearnerAssessmentBrowseFixture,
  cleanupLearnerAssessmentBrowseFixture,type LearnerAssessmentBrowseFixture}
  from "../support/learner-assessment-browse-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let owned:LearnerAssessmentBrowseFixture|null=null;
beforeEach(async()=>{
  owned=newLearnerAssessmentBrowseFixture();
  await seedLearnerAssessmentBrowseFixture(pool,owned);
},45000);
afterEach(async()=>{const f=owned;owned=null;if(f)await cleanupLearnerAssessmentBrowseFixture(pool,f);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L14-018 exact assessment links from persisted own application",()=>{
  it("only selects the scoped persisted assessment for the owned application",async()=>{
    const f=owned!;
    const result=await getLearnerPlacementRequestWorkspace(f.drive.learner.context);
    const own=JSON.parse(JSON.stringify(result.rounds)) as Array<{
      applicationId:string;roundId:string;roundKind:string;
      scheduledAt:string|null;exception:{scheduledAt:string}|null;
    }>;
    const links=ownApplicationAssessmentLinks(own,"2026-10-14T00:00:00Z");
    const exact=links.find(link=>link.applicationId===f.applicationId);
    expect(exact?.href).toContain("roundId="+f.roundId);
    expect(resolveOwnAssessmentDeepLink(own,{
      applicationId:f.applicationId,roundId:f.roundId,
    })).toEqual({valid:true,key:f.applicationId+":"+f.roundId});
  },30000);
  it("denies forged college, suspended and wrong-role principals",async()=>{
    const ctx=owned!.drive.learner.context;
    const forbidden:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of forbidden)
      await expect(getLearnerPlacementRequestWorkspace(actor)).rejects.toBeDefined();
  },30000);
});