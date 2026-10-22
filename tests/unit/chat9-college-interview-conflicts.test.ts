import {describe,expect,it} from "vitest";
import {collegeInterviewConflictIds} from "@/modules/placements/college-interview-conflicts-model";
const appointment=(id:string,applicationId:string,scheduledAt:string,venue:string,status="SCHEDULED")=>({
 id,applicationId,scheduledAt,venue,status,meetingUrl:null,interviewer:null,durationMinutes:30,
});
describe("college interviews attention conflicts",()=>{
 it("flags both sides of overlapping candidate or shared-room appointments",()=>{
  const rows=[
   appointment("one","learner-1","2026-10-22T09:00:00Z","Room A"),
   appointment("two","learner-2","2026-10-22T09:35:00Z","room a"),
   appointment("three","learner-3","2026-10-22T10:30:00Z","Room A"),
   appointment("four","learner-1","2026-10-22T09:15:00Z","Room B"),
  ];
  expect([...collegeInterviewConflictIds(rows)].sort()).toEqual(["four","one","two"]);
 });
 it("does not count cancelled rows, invalid intervals or unrelated rooms",()=>{
  const rows=[
   appointment("one","learner-1","2026-10-22T09:00:00Z","Room A"),
   appointment("cancelled","learner-1","2026-10-22T09:00:00Z","Room A","CANCELLED"),
   appointment("two","learner-2","2026-10-22T11:00:00Z","Room B"),
  ];
  expect(collegeInterviewConflictIds(rows).size).toBe(0);
 });
});
