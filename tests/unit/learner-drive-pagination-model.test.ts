import {describe,expect,it} from "vitest";
import {learnerDrivePageState} from "@/modules/placements/learner-drive-pagination-model";
describe("L12-015 learner role pagination",()=>{
 it("recovers a stale out-of-bounds deep link",()=>{
  expect(learnerDrivePageState(21,5)).toEqual({
    page:2,totalPages:2,startIndex:20,endIndex:21,
    firstNumber:21,lastNumber:21,recovered:true,
  });
 });
 it("handles exact boundaries and true empty sources",()=>{
  expect(learnerDrivePageState(20,1)).toMatchObject({page:1,totalPages:1,firstNumber:1,lastNumber:20,recovered:false});
  expect(learnerDrivePageState(0,1)).toMatchObject({page:1,totalPages:1,firstNumber:0,lastNumber:0,recovered:false});
  expect(learnerDrivePageState(1,999)).toMatchObject({page:1,totalPages:1,recovered:true});
 });
});
