import {describe,it,expect} from "vitest";
import {TPO_APPLICATION_VISIBLE_KEYS,validTpoColumnPreference} from "@/modules/placements/tpo-grid-model";
import {tpoApplicationUrlError} from "@/modules/placements/tpo-applications-url-guard";
describe("TPO applicant grid saved columns are non-sensitive",()=>{
 it("accepts visible column preferences",()=>{
  expect(validTpoColumnPreference("student,role,stage",TPO_APPLICATION_VISIBLE_KEYS)).toBe(true);
  expect(tpoApplicationUrlError({columns:"submitted,screening"})).toBeNull();
 });
 it("rejects export-only and guessed private fields",()=>{
  for(const columns of ["screeningUpdated","salary,phone","student,student", "role".repeat(250)]){
   expect(tpoApplicationUrlError({columns})).toMatch(/columns are invalid/);
  }
 });
});
