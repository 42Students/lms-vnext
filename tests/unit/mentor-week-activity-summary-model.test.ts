import {describe,expect,it} from "vitest";
import {mentorLoadedWeekActivitySummary} from "@/modules/projects/mentor-week-activity-summary-model";
const event=(id:string,eventType:string,occurredAt:string,summary=id)=>({
  id,eventType,occurredAt,summary,
});
describe("Mentor bounded weekly Activity summary",()=>{
 it("counts only loaded project events within current IST week",()=>{
  const now=new Date("2026-10-24T12:00:00Z");
  const summary=mentorLoadedWeekActivitySummary([
    event("move","projects.task.status_changed","2026-10-20T06:00:00Z"),
    event("sprint","projects.task.details_updated","2026-10-21T06:00:00Z",
      "Task pulled into sprint"),
    event("comment","projects.task.comment_added","2026-10-22T06:00:00Z"),
    event("shared","projects.resource.created","2026-10-24T06:00:00Z"),
    event("old","projects.task.status_changed","2026-10-18T06:00:00Z"),
    event("future","projects.resource.created","2026-10-25T13:00:00Z"),
  ],now);
  expect(summary).toEqual({taskMoves:2,comments:1,resourcesShared:1,count:4,
    partial:true});
 });
 it("respects the IST midnight cutoff and never invents missing events",()=>{
  const now=new Date("2026-10-26T01:00:00Z"); // Monday, 06:30 IST
  expect(mentorLoadedWeekActivitySummary([
    event("before","projects.task.status_changed","2026-10-25T18:29:59Z"),
    event("after","projects.task.status_changed","2026-10-25T18:30:00Z"),
  ],now).taskMoves).toBe(1);
  expect(mentorLoadedWeekActivitySummary([],now)).toEqual({
    taskMoves:0,comments:0,resourcesShared:0,count:0,partial:true});
 });
});
