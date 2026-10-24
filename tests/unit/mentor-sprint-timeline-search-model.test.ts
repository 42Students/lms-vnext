import {describe,expect,it} from "vitest";
import {filterMentorSprintTimeline} from
  "@/modules/projects/mentor-sprint-timeline-search-model";

const records=[
 {id:"s12",kind:"SPRINT" as const,title:"Sprint 12 · Checkout",
  context:"ACTIVE",href:"/mentor/projects/1?tab=board&sprint=s12"},
 {id:"s13",kind:"SPRINT" as const,title:"Sprint 13 · Payments",
  context:"PLANNED",href:"/mentor/projects/1?tab=board&sprint=s13"},
 {id:"r2",kind:"RELEASE" as const,title:"Release 2",
  context:"IN_PROGRESS",href:"/mentor/projects/1?tab=board&release=r2"},
 {id:"t1",kind:"TASK" as const,title:"Payment webhook",
  context:"Payments",href:"/mentor/projects/1?tab=board&task=t1"},
];
describe("Mentor sprint/release/task timeline search",()=>{
 it("finds partial names and multiple words with AND semantics",()=>{
  expect(filterMentorSprintTimeline(records,"payments").map(row=>row.id))
   .toEqual(["s13","t1"]);
  expect(filterMentorSprintTimeline(records,"sprint 13").map(row=>row.id))
   .toEqual(["s13"]);
  expect(filterMentorSprintTimeline(records,"payment webhook").map(row=>row.id))
   .toEqual(["t1"]);
 });
 it("ignores blank terms and caps a dense result safely",()=>{
  expect(filterMentorSprintTimeline(records,"  ")).toEqual([]);
  expect(filterMentorSprintTimeline(records,"sprint",1)).toHaveLength(1);
 });
});
