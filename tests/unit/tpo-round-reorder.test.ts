import {describe,expect,it} from "vitest";
import {moveRound,roundReorderLockMessage} from "@/modules/placements/tpo-round-reorder-model";
describe("TPO-drive-workspace-37 drag and arrow order",()=>{
 it("moves a single id without dropping or duplicating other rounds",()=>{
  expect(moveRound(["a","b","c"],"c",0)).toEqual(["c","a","b"]);
  expect(moveRound(["a","b","c"],"a",2)).toEqual(["b","c","a"]);
  expect(moveRound(["a","b"],"missing",0)).toEqual(["a","b"]);
  expect(moveRound(["a","b"],"a",-1)).toEqual(["a","b"]);
 });
 it("locks ended drives, results, attendance and scheduled rounds",()=>{
  expect(roundReorderLockMessage({jobStatus:"DRAFT",roundStatuses:["PENDING","PENDING"],hasExecutionArtifacts:false})).toBeNull();
  expect(roundReorderLockMessage({jobStatus:"PUBLISHED",roundStatuses:["PENDING","PENDING"],hasExecutionArtifacts:true})).toBe("The order is locked now that results or students are in a round.");
  expect(roundReorderLockMessage({jobStatus:"PUBLISHED",roundStatuses:["SCHEDULED","PENDING"],hasExecutionArtifacts:false})).toContain("locked");
  expect(roundReorderLockMessage({jobStatus:"CANCELLED",roundStatuses:["PENDING","PENDING"],hasExecutionArtifacts:false})).toContain("ended");
  expect(roundReorderLockMessage({jobStatus:"DRAFT",roundStatuses:["PENDING"],hasExecutionArtifacts:false})).toContain("two");
 });
});
