import {describe,expect,it} from "vitest";
import {tpoStudentUrlError,tpoStudentFilterMessage}
 from "@/modules/placements/tpo-students-url-guard";
import {normalizeTpoStudentLegacyFilters}
 from "@/modules/placements/tpo-students-filter-aliases";

describe("UX-tpo-students-duplicate-aliases-01 historic URL consistency",()=>{
 it("accepts one old filter alias and normalizes it to the canonical query key",()=>{
  expect(tpoStudentUrlError({f_branch:"11111111-1111-4111-8111-111111111111"})).toBeNull();
  expect(normalizeTpoStudentLegacyFilters({f_branch:"branch-a"})).toEqual({
   branchId:"branch-a",
  });
 });
 it("rejects two aliases mapping to the same filter before a server-page exception",()=>{
  for(const ambiguous of [
   {f_branch:"branch-a",f_branchId:"branch-b"},
   {f_program:"program-a",f_programId:"program-b"},
   {f_class:"class-a",f_classId:"class-b"},
   {f_batch:"batch-a",f_batchId:"batch-b"},
   {f_cgpaMin:"8",f_minCgpa:"7"},
   {f_cgpaMax:"9",f_maxCgpa:"10"},
   {f_profile:"VERIFIED",f_profileStatus:"WAITING"},
   {f_journey:"READY_NOT_APPLYING",f_journeyState:"PLACED"},
  ]){
   expect(tpoStudentUrlError(ambiguous)).toBe(
    "Choose each student filter once. No student data was loaded.");
   expect(tpoStudentFilterMessage(ambiguous)).toContain("No student data was loaded.");
  }
 });
 it("rejects alias plus normalized key, unknown tenant selectors and repeated values",()=>{
  expect(tpoStudentUrlError({f_branch:"first",branchId:"second"})).toContain("Choose each student filter once");
  expect(tpoStudentUrlError({collegeId:"foreign"})).toContain("Unsupported Students filter");
  expect(tpoStudentUrlError({search:["alice","bob"]})).toContain("Repeated Students filters");
 });
 it("preserves unrelated legacy aliases together",()=>{
  const raw={f_branch:"branch-a",f_program:"program-a",f_cgpaMin:"8"};
  expect(tpoStudentUrlError(raw)).toBeNull();
  expect(normalizeTpoStudentLegacyFilters(raw)).toEqual({
   branchId:"branch-a",programId:"program-a",minCgpa:"8",
  });
 });
});
