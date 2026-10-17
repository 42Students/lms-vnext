import { describe, expect, it } from "vitest";
import {
  browseLearnerApplications,
  learnerApplicationLatestActivity,
  learnerApplicationViewCounts,
  learnerApplicationStage,
  learnerApplicationStageOptions,
  DEFAULT_LEARNER_APPLICATION_FILTERS as defaults,
} from "@/modules/placements/learner-applications-browse-model";

function app(id:string, name:string, status:string, submitted:string) {
  return {
    applicationId:id, companyName:name, jobTitle:"Software Engineer",
    applicationStatus:status==="WITHDRAWN"?"WITHDRAWN":"SUBMITTED",
    submittedAt:new Date(submitted),
    withdrawnAt:status==="WITHDRAWN"?new Date(submitted):null,
    screening:{ status, decidedAt:null as Date|null },
    results:[] as Array<{appliedAt:Date|null}>,
  };
}
const records=[
  app("a","Acme","UNDER_REVIEW","2026-10-10T00:00:00Z"),
  app("b","Beta","SHORTLISTED","2026-10-11T00:00:00Z"),
  app("c","Acme","REJECTED","2026-10-12T00:00:00Z"),
  app("d","Delta","WITHDRAWN","2026-10-13T00:00:00Z"),
];
describe("Learner placement application browser", () => {
  it("separates active and final rejected/withdrawn from persisted status",()=>{
    expect(browseLearnerApplications(records,{...defaults,view:"progress"}).map(x=>x.applicationId))
      .toEqual(["b","a"]);
    expect(browseLearnerApplications(records,{...defaults,view:"completed"}).map(x=>x.applicationId))
      .toEqual(["d","c"]);
  });
  it("filters by company, position and exact screening stage",()=>{
    expect(browseLearnerApplications(records,{...defaults,search:"acme",view:"all",stage:"REJECTED"})
      .map(x=>x.applicationId)).toEqual(["c"]);
    expect(learnerApplicationStage(records[3]!)).toBe("WITHDRAWN");
  });
  it("shows final recorded-status counts without equating shortlist with hiring",()=>{
    expect(learnerApplicationViewCounts(records)).toEqual({
      all:4,progress:2,completed:2,
    });
    expect(learnerApplicationViewCounts([])).toEqual({
      all:0,progress:0,completed:0,
    });
  });
  it("sorts newest activity, company and oldest submission",()=>{
    const changed=records.map(x=>({...x}));
    changed[0]!.screening.decidedAt=new Date("2026-10-14T00:00:00Z");
    expect(browseLearnerApplications(changed,defaults)[0]?.applicationId).toBe("a");
    expect(browseLearnerApplications(records,{...defaults,view:"all",sort:"oldest"})[0]?.applicationId).toBe("a");
    expect(browseLearnerApplications(records,{...defaults,view:"all",sort:"company"}).map(x=>x.applicationId))
      .toEqual(["a","c","b","d"]);
  });
  it("sorts company titles naturally, case-insensitively and without mutating original rows",()=>{
    const named=[
      app("x","Company 10","UNDER_REVIEW","2026-10-10T00:00:00Z"),
      app("y","company 2","UNDER_REVIEW","2026-10-10T00:00:00Z"),
      app("z","COMPANY 1","UNDER_REVIEW","2026-10-10T00:00:00Z"),
    ];
    expect(browseLearnerApplications(named,{...defaults,sort:"company"}).map(x=>x.applicationId))
      .toEqual(["z","y","x"]);
    expect(named.map(x=>x.applicationId)).toEqual(["x","y","z"]);
  });
    it("sorts by persisted screening stage with stable recent-activity and ID tie breaks",()=>{
    expect(browseLearnerApplications(records,{...defaults,view:"all",sort:"stage"}).map(x=>x.applicationId))
      .toEqual(["c","b","a","d"]);
    expect(browseLearnerApplications(records,{...defaults,view:"all",sort:"stage",stage:"SHORTLISTED"})
      .map(x=>x.applicationId)).toEqual(["b"]);
  });
  it("derives only stages actually present in the learner's journeys",()=>{
    expect(learnerApplicationStageOptions(records)).toEqual([
      "REJECTED","SHORTLISTED","UNDER_REVIEW","WITHDRAWN",
    ]);
  });
});


describe("learner application recent activity includes the actual withdrawal",()=>{
  it("sorts a recently withdrawn application ahead of earlier screening without inventing current status",()=>{
    const base={
      applicationId:"a",jobTitle:"Software",companyName:"Company",
      applicationStatus:"SUBMITTED",submittedAt:new Date("2026-10-01T00:00:00Z"),
      withdrawnAt:null,screening:{status:"UNDER_REVIEW",decidedAt:new Date("2026-10-10T00:00:00Z")},
      results:[],
    };
    const withdrawn={...base,applicationId:"b",applicationStatus:"WITHDRAWN",
      withdrawnAt:new Date("2026-10-14T00:00:00Z"),screening:{...base.screening,decidedAt:null}};
    const sorted=browseLearnerApplications([base,withdrawn],{
      search:"",view:"all",stage:"all",sort:"activity"
    });
    expect(sorted.map(item=>item.applicationId)).toEqual(["b","a"]);
    expect(learnerApplicationLatestActivity(withdrawn)).toBe(new Date("2026-10-14T00:00:00Z").getTime());
  });
});
