import {describe,expect,it} from "vitest";
import {facultyLiveMutationSchema,facultyLiveWindow}
  from "@/modules/courses/faculty-live-mutation-model";
const id="00000000-0000-4000-8000-000000000001";
const dates={startsAt:"2099-10-20T09:00:00+05:30",endsAt:"2099-10-20T10:00:00+05:30"};
describe("Faculty live class mutation validation",()=>{
  it("requires confirmed HTTPS and offset-aware dates",()=>{
    const base={action:"CREATE",lessonId:id,title:"Live demo",
      meetingUrl:"https://meet.google.com/room",...dates,confirm:true};
    expect(facultyLiveMutationSchema.safeParse(base).success).toBe(true);
    expect(facultyLiveMutationSchema.safeParse({...base,meetingUrl:"http://insecure.example"}).success).toBe(false);
    expect(facultyLiveMutationSchema.safeParse({...base,meetingUrl:"https://localhost:8443"}).success).toBe(false);
    expect(facultyLiveMutationSchema.safeParse({...base,startsAt:"2099-10-20T09:00"}).success).toBe(false);
    expect(facultyLiveMutationSchema.safeParse({...base,confirm:false}).success).toBe(false);
    expect(facultyLiveMutationSchema.safeParse({...base,collegeId:id}).success).toBe(false);
    expect(facultyLiveMutationSchema.safeParse({...base,endsAt:dates.startsAt}).success).toBe(false);
  });
  it("does not restrict by academic period (legacy parity) but still needs a valid ordered window",()=>{
    const period={startDate:"2026-07-01",endDate:"2026-12-31"};
    expect(facultyLiveWindow(dates,period)).toBe(true);
    expect(facultyLiveWindow({...dates,startsAt:"2026-06-30T23:50:00+05:30"},period)).toBe(true);
    expect(facultyLiveWindow({startsAt:"2026-12-31T23:50:00+05:30",endsAt:"2027-01-01T00:00:01+05:30"},period)).toBe(true);
    expect(facultyLiveWindow({...dates,endsAt:dates.startsAt},period)).toBe(false);
  });
});
