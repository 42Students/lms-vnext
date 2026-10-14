import {describe,expect,it} from "vitest";
import {collegeHallBookingSchema,hallBookingWindow,hallCanFitClass,hallFacultyIsEligible}
  from "@/modules/academics/college-hall-booking-model";
const base={sectionId:"40000000-0000-4000-8000-000000000001",
  facultyMembershipId:null,date:"2026-10-15",from:"09:00",to:"10:00",
  title:"Math",expectedSectionUpdatedAt:"2026-10-14T11:00:00.123Z",confirm:true};
describe("College IST hall booking",()=>{
  it("requires an active Faculty account and membership",()=>{
    expect(hallFacultyIsEligible("ACTIVE","ACTIVE")).toBe(true);
    expect(hallFacultyIsEligible("DISABLED","ACTIVE")).toBe(false);
    expect(hallFacultyIsEligible("ACTIVE","SUSPENDED")).toBe(false);
  });
  it("normalizes dates to UTC without losing IST calendar boundaries",()=>{
    const window=hallBookingWindow(base);
    expect(window.startsAt.toISOString()).toBe("2026-10-15T03:30:00.000Z");
    expect(window.endsAt.toISOString()).toBe("2026-10-15T04:30:00.000Z");
  });
  it("requires confirmation and a millisecond-safe concurrency token",()=>{
    expect(collegeHallBookingSchema.parse(base)).toEqual(base);
    for(const patch of [{date:"2026-02-30"},{from:"10:00",to:"09:00"},
      {confirm:false},{expectedSectionUpdatedAt:"bad"},{collegeId:"foreign"}])
      expect(collegeHallBookingSchema.safeParse({...base,...patch}).success).toBe(false);
  });
  it("does not equate unknown Section capacity with zero occupancy",()=>{
    expect(hallCanFitClass(50,null)).toBe(true);
    expect(hallCanFitClass(50,51)).toBe(false);
  });
});
