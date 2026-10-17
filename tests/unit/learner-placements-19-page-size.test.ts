import {describe,it,expect} from "vitest";
import {learnerDrivePageState} from "@/modules/placements/learner-drive-pagination-model";
describe("LEARNER-placements-19 not a gap",()=>{
 it("LEARNER-placements-19 uses the legacy 20-role page size already",()=>{
  expect(learnerDrivePageState(41,1)).toMatchObject({page:1,endIndex:20,totalPages:3});
  expect(learnerDrivePageState(41,2)).toMatchObject({page:2,startIndex:20,endIndex:40});
 });
});