import {describe,it,expect} from "vitest";
import {placementLegacyPostingDetailsSchema,parseLegacyPairs}
 from "@/modules/placements/placement-legacy-posting-model";
import {createPlacementJobInputSchema} from "@/modules/placements/validation";
import {readFileSync} from "node:fs";
describe("Super Admin legacy job details",()=>{
 it("SA-placements-projects-14 bounds important dates and custom rules without fabricating visibility",()=>{
  expect(parseLegacyPairs("Test | 2099-12-31T09:00","date")).toEqual([{label:"Test",value:"2099-12-31T09:00"}]);
  expect(()=>parseLegacyPairs(Array(21).fill("A | B").join("\n"),"rule")).toThrow();
  const details={importantDates:[{label:"Interview",at:"2099-12-31T09:00:00+05:30"}]};
  expect(placementLegacyPostingDetailsSchema.safeParse(details).success).toBe(true);
  expect(placementLegacyPostingDetailsSchema.safeParse({
   importantDates:[{label:"Application deadline",at:"2099-12-31T09:00:00+05:30"}],
  }).success).toBe(false);
 });
 it("SA-placements-projects-14 validates assessment deadline chronology in strict create model",()=>{
  const base={collegeId:"00000000-0000-4000-8000-000000000001",
   companyRelationshipId:"00000000-0000-4000-8000-000000000002",
   title:"Job",employmentType:"FULL_TIME",workMode:"ONSITE",
   applicationDeadline:"2099-01-01T00:00:00.000Z"};
  expect(createPlacementJobInputSchema.safeParse({...base,legacyPostingDetails:{
   assessmentDeadline:"2098-12-31T00:00:00.000Z",
  }}).success).toBe(false);
 });
 it("SA-placements-projects-14 requires assessment deadline strictly later than application deadline",()=>{
  const base={collegeId:"00000000-0000-4000-8000-000000000001",
   companyRelationshipId:"00000000-0000-4000-8000-000000000002",
   title:"Role",employmentType:"FULL_TIME",workMode:"ONSITE",
   applicationDeadline:"2099-01-01T00:00:00.000Z"};
  expect(createPlacementJobInputSchema.safeParse({...base,legacyPostingDetails:{
   assessmentDeadline:"2099-01-01T00:00:00.000Z"}}).success).toBe(false);
  expect(createPlacementJobInputSchema.safeParse({...base,legacyPostingDetails:{
   assessmentDeadline:"2099-01-01T00:01:00.000Z"}}).success).toBe(true);
  const ui=readFileSync("src/components/placements/placement-job-create-form.tsx","utf8");
  expect(ui).toContain("Date.parse(assessmentDeadline)<=Date.parse(deadlineIso)");
 });
 it("SA-placements-projects-14 renders persisted draft terms without inventing a cross-college grant",()=>{
  const ui=readFileSync("src/components/placements/placement-job-create-form.tsx","utf8");
  for(const label of ["Responsibilities","Assessment URL","Important dates","Custom eligibility rules","Visibility and cross-college targeting"])
   expect(ui).toContain(label);
  expect(ui).toContain("legacyPostingDetails:{");
  const svc=readFileSync("src/modules/placements/job-service.ts","utf8");
  expect(svc).toContain("legacyPostingDetails:input.legacyPostingDetails??null");
 });
});
