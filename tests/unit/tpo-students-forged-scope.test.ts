import {describe,it,expect} from "vitest";
import {tpoStudentUrlError} from "@/modules/placements/tpo-students-url-guard";
describe("TPO Students allowlisted URL keys",()=>{
 it("rejects forged college scope instead of silently accepting it",()=>{
  expect(tpoStudentUrlError({collegeId:"other-college"})).toMatch(/Unsupported/);
  expect(tpoStudentUrlError({tenantId:"other-tenant"})).toMatch(/Unsupported/);
 });
 it("rejects typo filters, preserving a truthful user-visible result",()=>{
  expect(tpoStudentUrlError({journey:"PLACED"})).toMatch(/Unsupported/);
  expect(tpoStudentUrlError({journeyState:"PLACED",search:"learner"})).toBeNull();
 });
});
