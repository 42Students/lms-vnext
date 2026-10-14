import {describe,expect,it} from "vitest";
import {collegeCorrectionReadSchema,istCorrectionWindow,projectCorrectionSessions}
  from "@/modules/attendance/college-correction-read-model";

describe("College attendance correction read-only model",()=>{
  it("accepts bounded IST windows and rejects forged scope",()=>{
    expect(collegeCorrectionReadSchema.parse({})).toEqual({});
    expect(collegeCorrectionReadSchema.parse({from:"2026-10-14",to:"2026-10-14"}).from).toBe("2026-10-14");
    for(const invalid of [
      {from:"2026-10-14"},{from:"2026-02-30",to:"2026-03-01"},
      {from:"2026-10-15",to:"2026-10-14"},
      {from:"2026-10-01",to:"2026-11-05"},
      {from:"2026-10-14",to:"2026-10-14",collegeId:"foreign"},
    ])expect(collegeCorrectionReadSchema.safeParse(invalid).success).toBe(false);
    expect(istCorrectionWindow("2026-10-14","2026-10-14")).toEqual({
      start:new Date("2026-10-13T18:30:00Z"),
      endExclusive:new Date("2026-10-14T18:30:00Z"),
    });
  });
  it("reuses the authoritative Faculty window and preserves unknown mark state",()=>{
    const data=projectCorrectionSessions([{
      id:"event",title:"Algebra",sectionName:"A",
      startsAt:new Date("2026-10-14T04:00:00Z"),
      endsAt:new Date("2026-10-14T05:00:00Z"),
      attendanceStatus:null,markedAt:null,
    }],24,new Date("2026-10-14T06:00:00Z"));
    expect(data[0].facultyMarkingWindow).toBe("OPEN");
    expect(data[0].attendanceStatus).toBeNull();
    expect(data[0].markedAt).toBeNull();
    expect(data[0].startsAt).toBe("2026-10-14T04:00:00.000Z");
  });
});
