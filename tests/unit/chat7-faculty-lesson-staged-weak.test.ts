import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({execute:vi.fn()}));
vi.mock("@/db/client",()=>({getDb:()=>({execute:state.execute})}));
import {filterStagedStudentVisibleLessonContents} from "@/modules/courses/faculty-lesson-visibility-staged";
const one="11111111-1111-4111-8111-111111111111",two="22222222-2222-4222-8222-222222222222";
const lesson="33333333-3333-4333-8333-333333333333";
const rows=[{id:one,title:"Lesson 1"},{id:two,title:"Lesson 2"}];
beforeEach(()=>state.execute.mockReset());
describe("COURSES-WEAK-FAC-LESSON-STAGED-01 migration-aware student visibility",()=>{
 it("does not touch PostgreSQL for an already-empty authorized lesson content list",async()=>{
  expect(await filterStagedStudentVisibleLessonContents(lesson,[])).toEqual([]);
  expect(state.execute).not.toHaveBeenCalled();
 });
 it("preserves the scoped caller list while migration column is unavailable and does not query nonexistent column",async()=>{
  state.execute.mockResolvedValueOnce({rows:[{available:false}]});
  expect(await filterStagedStudentVisibleLessonContents(lesson,rows)).toEqual(rows);
  expect(state.execute).toHaveBeenCalledTimes(1);
 });
 it("filters to visible IDs only when migration exists; preserves original caller metadata and order",async()=>{
  state.execute.mockResolvedValueOnce({rows:[{available:true}]});
  state.execute.mockResolvedValueOnce({rows:[{id:two},{id:"foreign-lesson"}]});
  const selected=await filterStagedStudentVisibleLessonContents(lesson,rows);
  expect(selected).toEqual([rows[1]]);
  expect(state.execute).toHaveBeenCalledTimes(2);
 });
 it("no visible rows is a valid empty published-lesson state, not a fallback to exposing everything",async()=>{
  state.execute.mockResolvedValueOnce({rows:[{available:true}]});
  state.execute.mockResolvedValueOnce({rows:[]});
  expect(await filterStagedStudentVisibleLessonContents(lesson,rows)).toEqual([]);
 });
});
