import {describe,expect,it} from "vitest";
import {mentorMeetingCanReschedule,mentorMeetingRescheduleSchema,
  toIstLocalInput,fromIstLocalInput} from "@/modules/projects/mentor-meeting-reschedule-model";
describe("Mentor project meeting schedule guard",()=>{
  it("only reschedules an active scheduled meeting",()=>{
    expect(mentorMeetingCanReschedule("SCHEDULED","ACTIVE")).toBe(true);
    expect(mentorMeetingCanReschedule("REQUESTED","ACTIVE")).toBe(false);
    expect(mentorMeetingCanReschedule("COMPLETED","ACTIVE")).toBe(false);
    expect(mentorMeetingCanReschedule("SCHEDULED","ARCHIVED")).toBe(false);
  });
  it("checks duration, confirmation and forged tenant selectors",()=>{
    const input={startsAt:"2026-11-01T10:00:00+05:30",
      endsAt:"2026-11-01T11:00:00+05:30",
      expectedUpdatedAt:"2026-10-14T10:00:00.000Z",confirmed:true};
    expect(mentorMeetingRescheduleSchema.safeParse(input).success).toBe(true);
    expect(mentorMeetingRescheduleSchema.safeParse({...input,collegeId:"foreign"}).success).toBe(false);
    expect(mentorMeetingRescheduleSchema.safeParse({...input,confirmed:false}).success).toBe(false);
    expect(mentorMeetingRescheduleSchema.safeParse({...input,endsAt:input.startsAt}).success).toBe(false);
    expect(mentorMeetingRescheduleSchema.safeParse({...input,endsAt:"2026-11-02T11:00:00+05:30"}).success).toBe(false);
  });
  it("rejects impossible IST calendar dates rather than normalizing them",()=>{
    expect(fromIstLocalInput("2026-02-30T10:00")).toBeNull();
    expect(fromIstLocalInput("2026-04-31T12:30")).toBeNull();
    expect(fromIstLocalInput("2026-12-12T24:00")).toBeNull();
    expect(fromIstLocalInput("2026-12-12T09:60")).toBeNull();
    expect(fromIstLocalInput("2028-02-29T10:00")).toBe("2028-02-29T04:30:00.000Z");
  });
  it("round trips Kolkata wall-clock time independent of browser zone",()=>{
    expect(toIstLocalInput("2026-11-01T04:30:00.000Z")).toBe("2026-11-01T10:00");
    expect(fromIstLocalInput("2026-11-01T10:00")).toBe("2026-11-01T04:30:00.000Z");
    expect(fromIstLocalInput("not a date")).toBeNull();
  });
});
