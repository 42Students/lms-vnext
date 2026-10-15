import {expect,it} from "vitest";
import {facultyMoveContentId} from "@/modules/courses/faculty-content-order-ui-model";
it("moves only one content row with stable IDs and safe boundaries",()=>{
 const original=["a","b","c"] as const;
 expect(facultyMoveContentId(original,1,-1)).toEqual(["b","a","c"]);
 expect(facultyMoveContentId(original,1,1)).toEqual(["a","c","b"]);
 for(const [index,delta] of [[-1,1],[0,-1],[2,1],[10,1],[1,3]]){
  expect(facultyMoveContentId(original,index,delta)).toEqual(original);
 }
 expect(original).toEqual(["a","b","c"]);
});
