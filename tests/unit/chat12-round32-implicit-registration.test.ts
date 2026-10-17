import {describe,it,expect} from "vitest";
import {tpoStudentRegisteredForPlacements} from "@/modules/placements/tpo-students-model";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("TPO student implicit placement registration",()=>{
 it("TPO-students-50 counts application activity as registration when no DB08 row exists",()=>{
  expect(tpoStudentRegisteredForPlacements(null,1)).toBe(true);
  expect(tpoStudentRegisteredForPlacements(null,0)).toBe(false);
  expect(tpoStudentRegisteredForPlacements("PLACEMENTS",0)).toBe(true);
  expect(src("src/modules/placements/tpo-students-model.ts")).toContain('registrationChoice:source.registrationChoice??(registeredForPlacements?"PLACEMENTS":null)');
 });
});
