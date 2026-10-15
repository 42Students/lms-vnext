import {describe,it,expect} from "vitest";
import {tpoApplicantPipelineHasFilters} from "@/modules/placements/tpo-applicant-pipeline-model";
const defaults={stage:"ALL",search:"",channel:"ALL",eligibility:"ALL",submittedWithin:"ALL"};
describe("TPO applicant empty-state action",()=>{
 it("recognizes a genuinely unfiltered drive",()=>expect(tpoApplicantPipelineHasFilters(defaults)).toBe(false));
 it("shows recovery for every server-supported filter",()=>{
  for(const sample of [{stage:"HOLD"},{search:"Maya"},{channel:"INTERNAL"},{eligibility:"ELIGIBLE"},{submittedWithin:"LAST_7_DAYS"}])
   expect(tpoApplicantPipelineHasFilters({...defaults,...sample})).toBe(true);
 });
 it("treats blank search as unfiltered",()=>expect(tpoApplicantPipelineHasFilters({...defaults,search:"  "})).toBe(false));
});
