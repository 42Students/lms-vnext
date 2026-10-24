import {describe,expect,it} from "vitest";
import {mentorSprintPointSparkline} from
 "@/modules/projects/mentor-member-points-sparkline-model";
describe("Mentor per-learner mini point history",()=>{
 it("uses at most four latest actual signed-off points in sequence order",()=>{
  const rows=[5,2,3,4,1].map(sequence=>({
   sprintId:"s"+sequence,sequence,donePoints:sequence,
   plannedPoints:10,
  }));
  expect(mentorSprintPointSparkline(rows).map(row=>row.sequence))
   .toEqual([2,3,4,5]);
  expect(mentorSprintPointSparkline(rows)[3]).toMatchObject({
   doneHeightPct:50,plannedHeightPct:100,
  });
  expect(rows.map(row=>row.sequence)).toEqual([5,2,3,4,1]);
 });
 it("does not fabricate results from absent or invalid snapshots",()=>{
  const rows=mentorSprintPointSparkline([
   {sprintId:"bad",sequence:1,donePoints:11,plannedPoints:3},
   {sprintId:"ok",sequence:2,donePoints:0,plannedPoints:0},
  ]);
  expect(rows).toEqual([{
   sprintId:"ok",sequence:2,donePoints:0,plannedPoints:0,
   doneHeightPct:0,plannedHeightPct:0,
  }]);
 });
});
