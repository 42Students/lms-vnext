import {describe,it,expect} from "vitest";
import {learnerProjectActivityEmptyMessage} from "@/modules/projects/learner-project-activity-empty-model";
const base={valid:true,fetchedCount:0,pageCount:0,searching:false,filtered:false,olderPage:false,hasMore:false};
describe("learner Project Activity honest empty states",()=>{
 it("does not declare global history empty when the current page was filtered out",()=>{
  expect(learnerProjectActivityEmptyMessage({...base,fetchedCount:40,filtered:true})).toContain("this loaded page");
  expect(learnerProjectActivityEmptyMessage({...base,hasMore:true})).toContain("Older");
 });
 it("distinguishes first-run and last-page emptiness",()=>{
  expect(learnerProjectActivityEmptyMessage(base)).toBe("No project activity yet. Task moves, sprint updates and resource changes will appear here.");
  expect(learnerProjectActivityEmptyMessage({...base,olderPage:true})).toContain("No older activity");
 });
 it("does not claim the text query was applied to all historical pages",()=>{
  expect(learnerProjectActivityEmptyMessage({...base,fetchedCount:12,pageCount:12,searching:true})).toContain("this loaded page");
 });
});
