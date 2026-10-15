import {describe,it,expect} from "vitest";
import {TPO_STUDENT_VISIBLE_KEYS,validTpoColumnPreference} from "@/modules/placements/tpo-grid-model";
import {tpoStudentUrlError} from "@/modules/placements/tpo-students-url-guard";
describe("TPO student grid saved-column contract",()=>{
 it("allows only displayed columns, not export-only email or unknown fields",()=>{
  expect(validTpoColumnPreference("student,branch",TPO_STUDENT_VISIBLE_KEYS)).toBe(true);
  expect(tpoStudentUrlError({columns:"email"})).toMatch(/columns are invalid/);
  expect(tpoStudentUrlError({columns:"student,privateNotes"})).toMatch(/columns are invalid/);
 });
 it("rejects duplicate and unbounded deep-link column lists",()=>{
  expect(tpoStudentUrlError({columns:"student,student"})).toMatch(/invalid/);
  expect(tpoStudentUrlError({columns:"student".repeat(150)})).toMatch(/invalid/);
  expect(tpoStudentUrlError({columns:""})).toBeNull();
 });
});
