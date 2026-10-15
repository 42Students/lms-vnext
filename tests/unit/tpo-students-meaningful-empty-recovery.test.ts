import {describe,it,expect} from "vitest";
import {tpoStudentEmptyRecoveryHref} from "@/modules/placements/tpo-students-url-guard";
describe("TPO Students empty roster links",()=>{
 it("resets filters when there are no matching students",()=>{
  expect(tpoStudentEmptyRecoveryHref(0,"/tpo/students?journeyState=PLACED&page=1")).toBe("/tpo/students");
 });
 it("keeps scoped filters for a stale-page recovery",()=>{
  const href="/tpo/students?search=Anu&page=1";
  expect(tpoStudentEmptyRecoveryHref(36,href)).toBe(href);
 });
});
