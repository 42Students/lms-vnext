import {describe,expect,it} from "vitest";
import {scheduleProjectMeetingInputSchema} from
  "@/modules/projects/validation";

const base={
  title:"In-person sprint planning",
  startsAt:"2027-01-14T15:00:00+05:30",
  endsAt:"2027-01-14T16:00:00+05:30",
  timeZone:"Asia/Kolkata",
  status:"SCHEDULED",
  meetingUrl:null,
} as const;

describe("Mentor physical meeting scheduling contract",()=>{
  it("accepts a recorded physical venue in lieu of an online meeting link",()=>{
    const result=scheduleProjectMeetingInputSchema.safeParse({
      ...base,location:"  Lab 2  ",
    });
    expect(result.success).toBe(true);
    if(result.success){
      expect(result.data.location).toBe("Lab 2");
      expect(result.data.meetingUrl).toBeNull();
    }
  });
  it("still refuses a scheduled meeting with neither URL nor venue",()=>{
    expect(scheduleProjectMeetingInputSchema.safeParse(base).success).toBe(false);
  });
  it("does not accept blank or unbounded room names",()=>{
    expect(scheduleProjectMeetingInputSchema.safeParse({...base,location:"  "}).success).toBe(false);
    expect(scheduleProjectMeetingInputSchema.safeParse({...base,location:"a".repeat(201)}).success).toBe(false);
  });
  it("preserves online scheduling and draft-only no-link behavior",()=>{
    expect(scheduleProjectMeetingInputSchema.safeParse({
      ...base,meetingUrl:"https://meet.google.com/example",
    }).success).toBe(true);
    expect(scheduleProjectMeetingInputSchema.safeParse({
      ...base,status:"DRAFT",
    }).success).toBe(true);
  });
});
