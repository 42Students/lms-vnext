import {describe,expect,it} from "vitest";
import {publicPlacementSettingState} from "@/modules/placements/public-page/publication-view-model";
describe("T-S2-08 public toggle disabled states",()=>{
 it("fails closed if the publication table is missing",()=>{
  expect(publicPlacementSettingState({ready:false}).canEnable).toBe(false);
  expect(publicPlacementSettingState({ready:true,settings:null}).canEnable).toBe(false);
 });
 it("keeps opt-in disabled under the privacy threshold",()=>{
  expect(publicPlacementSettingState({ready:true,settings:{enabled:false,populationCount:4}}).canEnable).toBe(false);
  expect(publicPlacementSettingState({ready:true,settings:{enabled:false,populationCount:5}}).canEnable).toBe(true);
 });
 it("never presents an enabled state as disabled",()=>{
  expect(publicPlacementSettingState({ready:true,settings:{enabled:true,populationCount:5}})).toMatchObject({enabled:true,canEnable:true});
 });
});
