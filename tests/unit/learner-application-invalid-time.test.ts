import {it,expect} from "vitest";
import {learnerApplicationLatestActivity} from "@/modules/placements/learner-applications-browse-model";
it("keeps application sorting stable when a legacy imported result has an invalid date",()=>{
 const submittedAt=new Date("2026-10-15T00:00:00Z");
 const item={applicationId:"own",companyName:"Acme",jobTitle:"Engineer",applicationStatus:"SUBMITTED",submittedAt,withdrawnAt:null,screening:{status:"APPLIED",decidedAt:null},results:[{appliedAt:new Date("invalid")}]};
 expect(learnerApplicationLatestActivity(item)).toBe(submittedAt.getTime());
});
