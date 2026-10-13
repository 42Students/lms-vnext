import { describe, expect, it } from "vitest";
import {
  browseLearnerApplications,
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
    expect(browseLearnerApplications(records,{...defaults,search:"acme",stage:"REJECTED"})
      .map(x=>x.applicationId)).toEqual(["c"]);
    expect(learnerApplicationStage(records[3]!)).toBe("WITHDRAWN");
  });
  it("sorts newest activity, company and oldest submission",()=>{
    const changed=records.map(x=>({...x}));
    changed[0]!.screening.decidedAt=new Date("2026-10-14T00:00:00Z");
    expect(browseLearnerApplications(changed,defaults)[0]?.applicationId).toBe("a");
    expect(browseLearnerApplications(records,{...defaults,sort:"oldest"})[0]?.applicationId).toBe("a");
    expect(browseLearnerApplications(records,{...defaults,sort:"company"}).map(x=>x.applicationId))
      .toEqual(["a","c","b","d"]);
  });
  it("derives only stages actually present in the learner's journeys",()=>{
    expect(learnerApplicationStageOptions(records)).toEqual([
      "REJECTED","SHORTLISTED","UNDER_REVIEW","WITHDRAWN",
    ]);
  });
});
