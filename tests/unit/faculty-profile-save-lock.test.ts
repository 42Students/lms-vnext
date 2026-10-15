import {describe,expect,it} from "vitest";
import {beginFacultyProfileSave} from "@/modules/people/faculty-profile-save-lock";
describe("Faculty profile duplicate submit fence",()=>{
 it("only permits one mutation until the first request settles",()=>{
  const lock={current:false};
  expect(beginFacultyProfileSave(lock)).toBe(true);
  expect(beginFacultyProfileSave(lock)).toBe(false);
  lock.current=false;
  expect(beginFacultyProfileSave(lock)).toBe(true);
 });
});
