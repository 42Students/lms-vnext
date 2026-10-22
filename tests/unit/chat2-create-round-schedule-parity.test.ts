import {describe,expect,it} from "vitest";
import {createPlacementRoundInputSchema} from "@/modules/placements/validation";

const definition={kind:"INTERVIEW" as const,name:"Technical interview",durationMinutes:45};
const scheduled={...definition,scheduledAt:"2027-02-21T04:30:00.000Z",
 timezone:"Asia/Kolkata",mode:"ON_CAMPUS",venue:"Seminar Hall"};

describe("legacy round creation and optional scheduling",()=>{
 it("preserves the unscheduled draft creation contract",()=>{
  const parsed=createPlacementRoundInputSchema.parse(definition);
  expect(parsed.scheduledAt).toBeUndefined();
  expect(parsed.name).toBe("Technical interview");
 });
 it("accepts a full scheduled on-campus definition and parses dates",()=>{
  const parsed=createPlacementRoundInputSchema.parse(scheduled);
  expect(parsed.scheduledAt).toBeInstanceOf(Date);
  expect(parsed.mode).toBe("ON_CAMPUS");
 });
 it("rejects incomplete scheduling instead of silently creating a pending round",()=>{
  for(const incomplete of [
    {...definition,scheduledAt:scheduled.scheduledAt},
    {...scheduled,venue:null},
    {...scheduled,mode:"VIRTUAL",venue:null},
    {...scheduled,resultsDueAt:"2027-02-20T04:30:00.000Z"},
  ])expect(createPlacementRoundInputSchema.safeParse(incomplete).success).toBe(false);
 });
 it("requires a valid web meeting URL for a scheduled virtual round",()=>{
  const virtual={...scheduled,mode:"VIRTUAL",venue:null,
   meetingUrl:"https://meet.example.test/interview"};
  expect(createPlacementRoundInputSchema.safeParse(virtual).success).toBe(true);
  expect(createPlacementRoundInputSchema.safeParse({...virtual,meetingUrl:"javascript:alert(1)"}).success).toBe(false);
 });
});
