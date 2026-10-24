import {describe,expect,it} from "vitest";
import {mentorBlockerAge} from "@/modules/projects/mentor-blocker-age-model";
const now=new Date("2026-10-24T12:00:00.000Z");
describe("Mentor task blocker age",()=>{
 it("uses the most recent blocker transition, not a generic task update",()=>{
  const transitions=[
   {taskId:"one",occurredAt:"2026-10-01T12:00:00Z"},
   {taskId:"other",occurredAt:"2026-10-23T12:00:00Z"},
   {taskId:"one",occurredAt:"2026-10-19T11:00:00Z"},
  ];
  expect(mentorBlockerAge("one",transitions,now)).toEqual({
   kind:"KNOWN",sinceIso:"2026-10-19T11:00:00.000Z",days:5,
  });
 });
 it("returns UNKNOWN when an imported or historical task lacks evidence",()=>{
  expect(mentorBlockerAge("unknown",[],now)).toEqual({
   kind:"UNKNOWN",sinceIso:null,days:null,
  });
 });
 it("ignores future or invalid timestamps",()=>{
  expect(mentorBlockerAge("t",[
   {taskId:"t",occurredAt:"not-time"},
   {taskId:"t",occurredAt:"2099-10-24T12:00:00Z"},
  ],now).kind).toBe("UNKNOWN");
 });
 it("shows zero full days for a blocker recorded hours ago",()=>{
  expect(mentorBlockerAge("task",[
   {taskId:"task",occurredAt:"2026-10-24T08:00:00Z"},
  ],now)).toMatchObject({kind:"KNOWN",days:0});
 });
});
