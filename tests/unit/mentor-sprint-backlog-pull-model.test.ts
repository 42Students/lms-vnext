import {describe,expect,it} from "vitest";
import {mentorPullEligible,mentorPullSelectedPoints} from
 "@/modules/projects/mentor-sprint-backlog-pull-model";
const rows=[
 {id:"todo",status:"TODO",estimatePoints:3},
 {id:"review",status:"IN_REVIEW",estimatePoints:8},
 {id:"blocked",status:"BLOCKED",estimatePoints:null},
 {id:"done",status:"DONE",estimatePoints:5},
 {id:"todo",status:"TODO",estimatePoints:3},
 {id:"active",status:"IN_PROGRESS",estimatePoints:5},
];
describe("Mentor sprint backlog post-create planning",()=>{
 it("shows unfinished mutable tasks only and excludes duplicate IDs",()=>{
  const result=mentorPullEligible(rows);
  expect(result.candidates.map(row=>row.id)).toEqual(["todo","blocked","active"]);
  expect(result.excluded).toBe(3);
  expect(result.moreEligible).toBe(0);
 });
 it("reports truncated eligible tasks separately from review-only rows",()=>{
  const result=mentorPullEligible(rows,2);
  expect(result.candidates.map(row=>row.id)).toEqual(["todo","blocked"]);
  expect(result.moreEligible).toBe(1);
 });
 it("never fabricates estimates for missing values",()=>{
  expect(mentorPullSelectedPoints(rows.filter(row=>row.id!=="review"&&row.id!=="done"),
   ["todo","blocked","active"])).toEqual({
    count:3,points:8,unestimated:1,
   });
 });
 it("does not include tasks outside explicit selection",()=>{
  expect(mentorPullSelectedPoints(rows.slice(0,4),["todo"])).toEqual({
   count:1,points:3,unestimated:0,
  });
 });
});
