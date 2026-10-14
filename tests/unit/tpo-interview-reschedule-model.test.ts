import {describe,it,expect} from "vitest";
import {tpoInterviewRescheduleSchema,parseIstRoundLocalTime,overlappingInterviewVenue,validInterviewWindow}
 from "@/modules/placements/tpo-interview-reschedule-model";
describe("TPO interview reschedule policy",()=>{
 it("rejects invalid mode details, unconfirmed actions and forged colleges",()=>{
  const valid={confirmed:true,expectedUpdatedAt:"2026-10-14T12:00:00.123Z",
   localDateTime:"2026-10-20T10:00",mode:"ON_CAMPUS",venue:"Room A",reason:"Employer requested another day"};
  expect(tpoInterviewRescheduleSchema.safeParse(valid).success).toBe(true);
  expect(tpoInterviewRescheduleSchema.safeParse({...valid,venue:undefined}).success).toBe(false);
  expect(tpoInterviewRescheduleSchema.safeParse({...valid,confirmed:false}).success).toBe(false);
  expect(tpoInterviewRescheduleSchema.safeParse({...valid,collegeId:"forged"}).success).toBe(false);
  expect(tpoInterviewRescheduleSchema.parse({...valid,expectedUpdatedAt:"2026-10-14T17:30:00.123+05:30"})
   .expectedUpdatedAt).toBe(valid.expectedUpdatedAt);
  expect(tpoInterviewRescheduleSchema.safeParse({...valid,mode:"VIRTUAL",meetingUrl:"javascript:alert(1)"}).success).toBe(false);
  expect(tpoInterviewRescheduleSchema.safeParse({...valid,mode:"VIRTUAL",meetingUrl:"https://meet.example.org/panel"}).success).toBe(true);
 });
 it("compares half-open venue intervals and rejects unknown duration",()=>{
  const start=parseIstRoundLocalTime("2026-10-20T10:00");
  expect(start.toISOString()).toBe("2026-10-20T04:30:00.000Z");
  expect(validInterviewWindow(start,new Date("2026-10-19T00:00:00Z"),60)).toBe(true);
  expect(overlappingInterviewVenue(start,60,[{
   start:parseIstRoundLocalTime("2026-10-20T11:00"),durationMinutes:60,
  }])).toBe(false);
  expect(overlappingInterviewVenue(start,60,[{
   start:parseIstRoundLocalTime("2026-10-20T10:30"),durationMinutes:60,
  }])).toBe(true);
  expect(overlappingInterviewVenue(start,60,[{start,durationMinutes:null}])).toBe(true);
 });
});
