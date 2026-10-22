import {describe,it,expect} from "vitest";
import {tpoStudentUrlError,tpoStudentExportViewName} from "@/modules/placements/tpo-students-url-guard";
describe("TPO Students duplicate URL filters",()=>{
 it("rejects repeated status and pagination parameters before roster service access",()=>{
  expect(tpoStudentUrlError({journeyState:["PLACED","APPLYING"]})).toMatch(/Repeated/);
  expect(tpoStudentUrlError({page:["1","2"]})).toMatch(/Repeated/);
 });
 it("keeps a safe saved view label without widening authorized roster filters",()=>{
  expect(tpoStudentUrlError({view:"TCS shortlist",page:"1"})).toBeNull();
  expect(tpoStudentUrlError({view:["A","B"]})).toMatch(/Repeated/);
  expect(tpoStudentUrlError({view:"\u000dmalicious"})).toMatch(/Saved view name/);
  expect(tpoStudentExportViewName(" TCS shortlist ")).toBe("TCS shortlist");
  expect(tpoStudentExportViewName("x".repeat(101))).toBeNull();
 });
 it("allows ordinary scalar search, page and column preferences",()=>{
  expect(tpoStudentUrlError({journeyState:"PLACED",page:"1",columns:"student,branch"})).toBeNull();
 });
});
