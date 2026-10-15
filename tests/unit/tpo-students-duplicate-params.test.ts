import {describe,it,expect} from "vitest";
import {tpoStudentUrlError} from "@/modules/placements/tpo-students-url-guard";
describe("TPO Students duplicate URL filters",()=>{
 it("rejects repeated status and pagination parameters before roster service access",()=>{
  expect(tpoStudentUrlError({journeyState:["PLACED","APPLYING"]})).toMatch(/Repeated/);
  expect(tpoStudentUrlError({page:["1","2"]})).toMatch(/Repeated/);
 });
 it("allows ordinary scalar search, page and column preferences",()=>{
  expect(tpoStudentUrlError({journeyState:"PLACED",page:"1",columns:"student,branch"})).toBeNull();
 });
});
