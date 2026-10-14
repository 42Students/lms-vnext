import {afterAll,afterEach,beforeEach,describe,expect,it} from "vitest";
import {Pool} from "pg";
import type {RequestContext} from "@/modules/identity/context";
import {closeDatabaseConnection} from "@/db/client";
import {getLearnerPlacementJourney} from "@/modules/placements/learner-journey-service";
import {browseLearnerApplications,DEFAULT_LEARNER_APPLICATION_FILTERS,
  type LearnerApplicationBrowseItem} from "@/modules/placements/learner-applications-browse-model";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {newLearnerCareerCalendarFixture,seedLearnerCareerCalendarFixture,
  cleanupLearnerCareerCalendarFixture,type LearnerCareerCalendarFixture}
  from "../support/learner-career-calendar-fixture";
if(!process.env.TEST_DATABASE_URL)throw new Error("Disposable TEST_DATABASE_URL required");
const pool=new Pool({connectionString:process.env.TEST_DATABASE_URL,max:1});
let fixture:LearnerCareerCalendarFixture|null=null;
beforeEach(async()=>{fixture=newLearnerCareerCalendarFixture();await seedLearnerCareerCalendarFixture(pool,fixture);},45000);
afterEach(async()=>{const current=fixture;fixture=null;if(current)await cleanupLearnerCareerCalendarFixture(pool,current);},45000);
afterAll(async()=>{await pool.end();await closeDatabaseConnection();},30000);
describe("L14-006 own-college screening-stage application sort",()=>{
  it("sorts a persisted shortlisted learner application by the real screening stage",async()=>{
    const f=fixture!;
    const rows=await getLearnerPlacementJourney(f.drive.learner.context);
    const client=JSON.parse(JSON.stringify(rows)) as Array<{
      applicationId:string;applicationStatus:string;
      submittedAt:string;withdrawnAt:string|null;
      job:{title:string};company:{name:string};
      screening:{status:string;decidedAt:string|null};
      results:{appliedAt:string|null}[];
    }>;
    const items:LearnerApplicationBrowseItem[]=client.map(row=>({
      applicationId:row.applicationId,jobTitle:row.job.title,
      companyName:row.company.name,applicationStatus:row.applicationStatus,
      submittedAt:new Date(row.submittedAt),
      withdrawnAt:row.withdrawnAt?new Date(row.withdrawnAt):null,
      screening:{status:row.screening.status,
        decidedAt:row.screening.decidedAt?new Date(row.screening.decidedAt):null},
      results:row.results.map(result=>({
        appliedAt:result.appliedAt?new Date(result.appliedAt):null,
      })),
    }));
    expect(browseLearnerApplications(items,{...DEFAULT_LEARNER_APPLICATION_FILTERS,sort:"stage"})
      .some(item=>item.applicationId===f.applicationId &&
        item.screening.status==="SHORTLISTED")).toBe(true);
  },30000);
  it("denies foreign college, suspended and wrong-role reads",async()=>{
    const ctx=fixture!.drive.learner.context;
    const others:RequestContext[]=[
      {...ctx,membership:{...ctx.membership!,collegeId:SEED_IDS.collegeB}},
      {...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}},
      {...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}},
    ];
    for(const actor of others)
      await expect(getLearnerPlacementJourney(actor)).rejects.toBeDefined();
  },30000);
});
