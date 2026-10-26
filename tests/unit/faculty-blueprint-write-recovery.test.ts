import {describe,it,expect} from "vitest";
import {facultyBlueprintWriteNeedsReload} from "../../src/modules/courses/faculty-blueprint-write-recovery";
describe("Faculty Blueprint mutation reconciliation",()=>{
 it("requires readback for unknown outcomes, stale versions and server failures",()=>{
  for(const status of [null,408,409,412,500,502,503,504])
   expect(facultyBlueprintWriteNeedsReload(status)).toBe(true);
 });
 it("allows correcting validated client errors without falsely claiming success",()=>{
  for(const status of [400,401,403,404,422,429])
   expect(facultyBlueprintWriteNeedsReload(status)).toBe(false);
 });
});
