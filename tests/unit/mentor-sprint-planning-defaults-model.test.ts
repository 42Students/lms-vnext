import {describe,expect,it} from "vitest";
import {mentorSprintPlanningDefaults} from
 "@/modules/projects/mentor-sprint-planning-defaults-model";
describe("Mentor sprint plan default suggestions",()=>{
 it("calculates release-local sequence even when another release has bigger IDs",()=>{
  const plan=mentorSprintPlanningDefaults("release-two",[
   {releaseId:"release-one",sequence:17,endDate:"2026-10-21"},
   {releaseId:"release-two",sequence:0,endDate:"2026-10-23"},
   {releaseId:"release-two",sequence:1,endDate:"2026-10-30"},
  ]);
  expect(plan).toEqual({
   title:"Sprint 3",sequence:2,
   startDate:"2026-10-31",endDate:"2026-11-06",
  });
 });
 it("gives no fabricated dates when there is no valid prior end date",()=>{
  expect(mentorSprintPlanningDefaults("new",[
    {releaseId:"other",sequence:7,endDate:"2026-10-22"},
  ])).toEqual({title:"Sprint 1",sequence:0,startDate:"",endDate:""});
  expect(mentorSprintPlanningDefaults("r",[
    {releaseId:"r",sequence:3,endDate:"2026-02-30"},
  ])).toEqual({title:"Sprint 5",sequence:4,startDate:"",endDate:""});
 });
 it("crosses month and year boundaries using UTC dates, not device locale",()=>{
  expect(mentorSprintPlanningDefaults("r",[
   {releaseId:"r",sequence:0,endDate:"2026-12-29"},
  ])).toMatchObject({startDate:"2026-12-30",endDate:"2027-01-05"});
 });
 it("does not suggest an expired historical week while preserving release sequence",()=>{
  const plan=mentorSprintPlanningDefaults("r",[
    {releaseId:"r",sequence:12,endDate:"2021-01-02"},
  ],"2026-10-24");
  expect(plan).toEqual({title:"Sprint 14",sequence:13,
    startDate:"",endDate:""});
 });
 it("preserves the most recent sequence without reusing older gaps",()=>{
  expect(mentorSprintPlanningDefaults("r",[
    {releaseId:"r",sequence:0,endDate:"2026-10-01"},
    {releaseId:"r",sequence:3,endDate:"2026-10-29"},
  ]).sequence).toBe(4);
 });
});
