import {describe,expect,it} from "vitest";
import {
 mentorActivityLabel,mentorActivityCategory,mentorActivityRelativeTime,
} from "@/modules/projects/mentor-activity-display-model";
import {
 matchesMentorProjectWork,mentorTaskProgress,
} from "@/modules/projects/mentor-project-work-model";
import {mentorReviewedTasksCsv} from "@/modules/projects/mentor-task-review-export-model";

const now="2026-10-18T12:00:00.000Z";
const before=(milliseconds:number)=>new Date(Date.parse(now)-milliseconds).toISOString();

describe("PROJ-BREAK-MENTOR-142..149 audit truth, registered progress and CSV boundaries",()=>{
 it("PROJ-BREAK-MENTOR-142 future and invalid activity instants must not claim past completion",()=>{
  expect(mentorActivityRelativeTime("not-an-instant",now)).toBe("Time unavailable");
  expect(mentorActivityRelativeTime("2026-10-18T12:00:00.001Z",now)).toBe("Time unavailable");
  expect(mentorActivityRelativeTime(before(1),now)).toBe("Just now");
  expect(mentorActivityRelativeTime(before(60_000),now)).toBe("1m ago");
  expect(mentorActivityRelativeTime(before(3_600_000),now)).toBe("1h ago");
  expect(mentorActivityRelativeTime(before(86_400_000),now)).toBe("1d ago");
 });
 it("PROJ-BREAK-MENTOR-143 activity categories are safe descriptive labels, not raw metadata",()=>{
  expect(mentorActivityLabel("")).toBe("Update");
  expect(mentorActivityLabel("PROJECT.TASK_SUBMITTED")).toBe("Task Submitted");
  for(const [input,expected] of [
    ["project.meeting.recorded","Meeting"],["project.resource.updated","Resource"],
    ["project.sprint.completed","Sprint"],["project.delivery.approved","Submission"],
    ["project.team.member.joined","Team"],["project.task.created","Task"],
    ["project.created","Overview"],
  ])expect(mentorActivityCategory(input)).toBe(expected);
 });
 it("PROJ-BREAK-MENTOR-144 approved task counts cannot derive 100 percent from corrupt data",()=>{
  expect(mentorTaskProgress(undefined)).toBeNull();
  expect(mentorTaskProgress({total:0,open:0})).toBeNull();
  for(const counts of [
   {total:5,open:-1},{total:5,open:6},{total:5,open:Infinity},
   {total:Infinity,open:0},{total:NaN,open:0},{total:1.5,open:0},
  ])expect(mentorTaskProgress(counts)).toBeNull();
  expect(mentorTaskProgress({total:5,open:2})).toMatchObject({
   percent:60,label:"3 of 5 recorded tasks done",
  });
  expect(mentorTaskProgress({total:5,open:0})?.percent).toBe(100);
 });
 it("PROJ-BREAK-MENTOR-145 all work filter predicates fail closed on unrecognized or corrupt counts",()=>{
  expect(matchesMentorProjectWork("NO_TASKS",undefined)).toBe(true);
  expect(matchesMentorProjectWork("ALL_DONE",undefined)).toBe(false);
  expect(matchesMentorProjectWork("ALL_DONE",{total:4,open:0})).toBe(true);
  expect(matchesMentorProjectWork("HAS_OPEN_TASKS",{total:4,open:3})).toBe(true);
  expect(matchesMentorProjectWork("HAS_DONE_TASKS",{total:4,open:3})).toBe(true);
  expect(matchesMentorProjectWork("HAS_DONE_TASKS",{total:4,open:4})).toBe(false);
  expect(matchesMentorProjectWork("FORGED" as never,{total:4,open:2})).toBe(false);
  for(const bad of [{total:5,open:-1},{total:5,open:6},{total:NaN,open:0}]){
   for(const filter of ["NO_TASKS","ALL_DONE","HAS_OPEN_TASKS","HAS_DONE_TASKS"] as const){
    expect(matchesMentorProjectWork(filter,bad)).toBe(false);
   }
  }
 });
 it("PROJ-BREAK-MENTOR-146 review export independently caps direct rows at 200",()=>{
  const rows=Array.from({length:203},(_,i)=>({
   id:"review-"+i,projectTitle:i===0?"=HYPERLINK(\"https://bad\")":"Atlas",
   taskTitle:"Test report",status:"APPROVED",version:i+1,
   reviewedAt:i===0?new Date(NaN):new Date(now),
  }));
  const csv=mentorReviewedTasksCsv(rows,7);
  expect(csv.replace(/^\uFEFF/,"").trim().split("\r\n")).toHaveLength(202);
  expect(csv).toContain("10 additional reviewed versions");
  expect(csv).toContain("'=HYPERLINK");
  expect(csv).toContain("Not recorded");
  expect(csv).toContain("Reviewed (IST)");
  expect(csv).not.toContain("review-202");
  expect(csv).not.toContain("learner_email");
  expect(csv).not.toContain("feedback");
 });
 it("PROJ-BREAK-MENTOR-147 missing/invalid omitted count cannot inflate export truncation",()=>{
  const sample=[{id:"review",projectTitle:"Atlas",taskTitle:"Task",status:"APPROVED",
   version:1,reviewedAt:new Date(now)}];
  expect(mentorReviewedTasksCsv(sample,Number.NaN)).not.toContain("Truncated");
  expect(mentorReviewedTasksCsv(sample,-500)).not.toContain("Truncated");
  expect(mentorReviewedTasksCsv(sample,2)).toContain("2 additional reviewed versions");
 });
});
