import {describe,expect,it} from "vitest";
import {tpoPlacementAudienceSchema} from "@/modules/announcements/tpo-placement-audience-model";
describe("T-S2-07 announcement audience preview parsing",()=>{
 it("supports legacy PLACEMENTS, BATCHES, BRANCHES and DRIVE kinds",()=>{
  expect(tpoPlacementAudienceSchema.parse({kind:"PLACEMENTS"})).toEqual({kind:"PLACEMENTS"});
  const id="7ea15130-4c20-4b1d-8abe-451250a8c640";
  expect(tpoPlacementAudienceSchema.parse({kind:"BATCHES",cohortIds:[id]})).toEqual({kind:"BATCHES",cohortIds:[id]});
  expect(tpoPlacementAudienceSchema.parse({kind:"BRANCHES",departmentIds:[id]}).kind).toBe("BRANCHES");
  expect(tpoPlacementAudienceSchema.parse({kind:"DRIVE",jobId:id}).kind).toBe("DRIVE");
 });
 it("rejects unbounded, missing or extra targeting",()=>{
  expect(tpoPlacementAudienceSchema.safeParse({kind:"BATCHES",cohortIds:[]}).success).toBe(false);
  expect(tpoPlacementAudienceSchema.safeParse({kind:"DRIVE"}).success).toBe(false);
  expect(tpoPlacementAudienceSchema.safeParse({kind:"PLACEMENTS",collegeId:"other"}).success).toBe(false);
  expect(tpoPlacementAudienceSchema.safeParse({kind:"ALL"}).success).toBe(false);
 });
});
