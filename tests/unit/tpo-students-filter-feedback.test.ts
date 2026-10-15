import {describe,it,expect} from "vitest";
import {tpoStudentFilterMessage} from "@/modules/placements/tpo-students-url-guard";
describe("TPO Students route explains invalid filters safely",()=>{
 it("identifies broken page values and oversized search",()=>{
  expect(tpoStudentFilterMessage({page:"0"})).toMatch(/positive whole number/);
  expect(tpoStudentFilterMessage({page:"one"})).toMatch(/positive whole number/);
  expect(tpoStudentFilterMessage({search:"x".repeat(151)})).toMatch(/too long/);
 });
 it("does not expose foreign branch identifiers",()=>{
  const bad="private-branch-identifier";
  expect(tpoStudentFilterMessage({branchId:bad})).toMatch(/academic branch/);
  expect(tpoStudentFilterMessage({branchId:bad})).not.toContain(bad);
 });
 it("retains duplicate and forged scope protections",()=>{
  expect(tpoStudentFilterMessage({search:["A","B"]})).toMatch(/Repeated/);
  expect(tpoStudentFilterMessage({collegeId:"foreign"})).toMatch(/Unsupported/);
 });
});
