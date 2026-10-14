import {describe,expect,it} from "vitest";
import {learnerApplicationCardActivity} from "@/modules/placements/learner-application-card-activity-model";
const id="92929292-9292-4929-8929-929292929292";
const base={applicationId:id,jobTitle:"Analyst",companyName:"Example",applicationStatus:"SUBMITTED",
 submittedAt:new Date("2026-10-01T10:00:00Z"),withdrawnAt:null,
 screening:{status:"SHORTLISTED",decidedAt:new Date("2026-10-03T10:00:00Z")},
 results:[{appliedAt:new Date("2026-10-04T10:00:00Z")}]};
describe("learner application card last-recorded activity",()=>{
 it("links exact UUID history and prioritizes real later withdrawal",()=>{
  const row={...base,withdrawnAt:new Date("2026-10-06T10:00:00Z")};
  expect(learnerApplicationCardActivity(row).at.toISOString()).toBe("2026-10-06T10:00:00.000Z");
  expect(learnerApplicationCardActivity(row).historyHref).toBe("/learn/my-placements/applications/"+id+"/history");
 });
 it("uses applied result over earlier shortlist and rejects malformed navigation ID",()=>{
  const row={...base,applicationId:"foreign-query"};
  expect(learnerApplicationCardActivity(row).at.toISOString()).toBe("2026-10-04T10:00:00.000Z");
  expect(learnerApplicationCardActivity(row).historyHref).toBeNull();
 });
});
