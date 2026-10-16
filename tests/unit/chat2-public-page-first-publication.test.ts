import { describe,expect,it } from "vitest";
import { publicPlacementSettingState } from "@/modules/placements/public-page/publication-view-model";
import { publicPublicationDecision } from "@/modules/placements/public-page/publication-policy";
describe("TPO-campaigns-public-32 first publication",()=>{
 it("permits first-time publication with five eligible learners",()=>{
  expect(publicPlacementSettingState({ready:true,settings:null,populationCount:5}))
   .toMatchObject({canEnable:true,enabled:false,populationCount:5});
  expect(publicPublicationDecision({enabled:true},{populationCount:5,publishedAt:null})).toBe("ENABLE");
 });
 it("fails closed for small cohorts and missing storage",()=>{
  expect(publicPlacementSettingState({ready:true,settings:null,populationCount:4}).canEnable).toBe(false);
  expect(publicPlacementSettingState({ready:false}).canEnable).toBe(false);
  expect(publicPublicationDecision({enabled:true},{populationCount:4,publishedAt:null})).toBe("SMALL_COHORT");
 });
 it("allows opting out even after cohort changes",()=>{
  expect(publicPublicationDecision({enabled:false},{populationCount:0,publishedAt:null})).toBe("DISABLE");
 });
});
