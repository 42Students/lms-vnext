import {describe,expect,it} from "vitest";
import {learnerAssessmentSort} from "@/modules/courses/learner-assessment-sort-model";
const items=[
 {id:"b",title:"Zebra",dueAt:null,createdAt:"2026-10-15T10:00:00Z"},
 {id:"a",title:"Alpha",dueAt:"2026-10-14T10:00:00Z",createdAt:"2026-10-12T10:00:00Z"},
 {id:"c",title:"Beta",dueAt:"2026-10-16T10:00:00Z",createdAt:"2026-10-13T10:00:00Z"},
];
describe("learner assessment sorting",()=>{
 it("sorts dated deadlines before undated items without mutating input",()=>{
  expect(learnerAssessmentSort(items,"DUE").map(x=>x.id)).toEqual(["a","c","b"]);
  expect(items[0]?.id).toBe("b");
 });
 it("sorts by persisted timestamps or title with invalid mode fallback",()=>{
  expect(learnerAssessmentSort(items,"CREATED").map(x=>x.id)).toEqual(["b","c","a"]);
  expect(learnerAssessmentSort(items,"TITLE").map(x=>x.id)).toEqual(["a","c","b"]);
  expect(learnerAssessmentSort(items,"UNKNOWN").map(x=>x.id)).toEqual(["a","c","b"]);
 });
});
