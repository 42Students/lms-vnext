import {describe,it,expect} from "vitest";
import {filterLearnerProjectActivityText} from "@/modules/projects/learner-project-activity-text-model";
const rows=[{summary:"Updated sprint",subjectLabel:"Alpha",actorDisplayName:"Mentor"},{summary:"Submitted task",subjectLabel:null,actorDisplayName:"Student"}];
describe("learner Project Activity page text search",()=>{
 it("matches only the supplied authorized page of rows",()=>{
  expect(filterLearnerProjectActivityText(rows,"mentor")).toEqual([rows[0]]);
  expect(filterLearnerProjectActivityText(rows,"task")).toEqual([rows[1]]);
  expect(filterLearnerProjectActivityText(rows,"unrelated")).toEqual([]);
 });
 it("invalid long search leaves the bounded original page available",()=>{
  expect(filterLearnerProjectActivityText(rows,"x".repeat(101))).toEqual(rows);
 });
});
