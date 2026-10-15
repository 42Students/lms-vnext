import {describe,expect,it} from "vitest";
import {advanceFacultySectionRevision} from "@/modules/people/faculty-section-revision-model";
describe("Faculty independent profile editor drafts",()=>{
 it("updates only the saved section and retains unrelated draft keys",()=>{
  const first={about:2,education:7};
  const next=advanceFacultySectionRevision(first,"education");
  expect(next).toEqual({about:2,education:8});
  expect(first.education).toBe(7);
  expect(advanceFacultySectionRevision(next,"skills")).toEqual({about:2,education:8,skills:1});
 });
});
