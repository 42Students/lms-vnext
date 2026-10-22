import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {candidateInterviewBufferedBounds,LEGACY_INTERVIEW_CANDIDATE_BUFFER_MINUTES}
 from "@/modules/placements/tpo-interview-slot-model";

describe("legacy candidate interview overlap buffer",()=>{
 const start=new Date("2026-12-10T09:00:00Z");
 const end=new Date("2026-12-10T09:30:00Z");
 it("extends candidate conflict checks by the old fifteen-minute buffer",()=>{
  expect(LEGACY_INTERVIEW_CANDIDATE_BUFFER_MINUTES).toBe(15);
  const b=candidateInterviewBufferedBounds(start,end);
  expect(b.earliestConflictEnd.toISOString()).toBe("2026-12-10T08:45:00.000Z");
  expect(b.latestConflictStart.toISOString()).toBe("2026-12-10T09:45:00.000Z");
  expect(new Date("2026-12-10T09:40:00Z")<b.latestConflictStart).toBe(true);
  expect(new Date("2026-12-10T09:45:00Z")<b.latestConflictStart).toBe(false);
 });
 it("rejects reversed and unbounded windows",()=>{
  expect(()=>candidateInterviewBufferedBounds(end,start)).toThrow(RangeError);
  expect(()=>candidateInterviewBufferedBounds(start,end,-1)).toThrow(RangeError);
  expect(()=>candidateInterviewBufferedBounds(start,end,1441)).toThrow(RangeError);
 });
 it("uses candidate-wide query under persisted user lock",()=>{
  const service=readFileSync("src/modules/placements/tpo-interview-slot-service.ts","utf8");
  expect(service).toContain("candidateInterviewBufferedBounds(startsAt,endsAt)");
  expect(service).toContain("eq(collegeMemberships.userId,application.userId)");
  expect(service).toContain("lt(placementRoundCandidateSlots.startsAt,window.latestConflictStart)");
  expect(service).toContain("gt(placementRoundCandidateSlots.endsAt,window.earliestConflictEnd)");
  expect(service).toContain('where(eq(users.id,application.userId)).for("update")');
 });
});
