import { describe, expect, it } from "vitest";
import { learnerApplicationStage, learnerApplicationIsComplete } from "@/modules/placements/learner-applications-browse-model";

const base = {
  applicationId:"application", jobTitle:"Engineer", companyName:"Company",
  applicationStatus:"SUBMITTED", submittedAt:new Date("2026-10-14T08:00:00Z"),
  withdrawnAt:null,screening:{status:"SHORTLISTED",decidedAt:null},
  results:[] as {appliedAt:Date|null;outcome?:string|null}[],
};
describe("P-S2-10 derived stage from persisted results and offers", () => {
  it("distinguishes withdrawn, accepted, and issued offer priorities", () => {
    expect(learnerApplicationStage({...base,offerStatus:"ISSUED"})).toBe("OFFERED");
    expect(learnerApplicationStage({...base,offerStatus:"ACCEPTED"})).toBe("HIRED");
    expect(learnerApplicationIsComplete({...base,offerStatus:"ACCEPTED"})).toBe(true);
    expect(learnerApplicationStage({...base,offerStatus:"ISSUED",applicationStatus:"WITHDRAWN"})).toBe("WITHDRAWN");
  });
  it("uses the most recently applied round outcome, not staging order", () => {
    const old=new Date("2026-10-11T09:00:00Z"), recent=new Date("2026-10-12T09:00:00Z");
    expect(learnerApplicationStage({...base,results:[
      {appliedAt:old,outcome:"PASS"},{appliedAt:recent,outcome:"HOLD"},
    ]})).toBe("WAITLISTED");
    expect(learnerApplicationStage({...base,results:[
      {appliedAt:recent,outcome:"FAIL"},
    ]})).toBe("REJECTED");
  });
});
