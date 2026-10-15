import {describe,it,expect} from "vitest";
import {publicMetricRelease} from "@/modules/placements/public-metric-release";
import {publicPlacementDisclosure} from "@/modules/placements/public-placement-disclosure-model";
describe("publication threshold",()=>{
 it("will not reveal smaller cohorts even when stored",()=>{
  expect(publicMetricRelease({enabled:true,collegeActive:true,population:4,count:4})).toBeNull();
  expect(publicMetricRelease({enabled:true,collegeActive:true,population:10,count:4})).toBeNull();
  expect(publicMetricRelease({enabled:true,collegeActive:true,population:10,count:5})).toBe(5);
  expect(publicPlacementDisclosure([{label:"Placed",count:null}])[0].suppressed).toBe(true);
 });
});
