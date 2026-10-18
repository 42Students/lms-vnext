import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {tpoStudentProfileFacts} from "@/modules/placements/tpo-student-profile-facts";

describe("TPO-students-31 truthful roster readiness notes",()=>{
 it("does not invent a missing resume when the source profile is unavailable",()=>{
  const source=readFileSync(new URL("../../src/components/tpo/tpo-students-spreadsheet.tsx",import.meta.url),"utf8");
  expect(source).toContain('row.profileFacts?.resume===false?"No resume":""');
  expect(source).not.toContain('!row.profileFacts?.resume?"No resume":""');
 });
 it("retains a clear missing-resume note only for an explicit false source field",()=>{
  const unknown=tpoStudentProfileFacts({});
  const noResume=tpoStudentProfileFacts({resume:null});
  expect(unknown.resume).toBe(false);
  expect(noResume.resume).toBe(false);
  // The source projection's false is a concrete profile-document absence;
  // an entirely missing profile projection is undefined and is not evidence.
  const note=(value:{resume:boolean}|undefined)=>value?.resume===false?"No resume":"";
  expect(note(undefined)).toBe("");
  expect(note(noResume)).toBe("No resume");
 });
});
