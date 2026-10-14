import {describe,expect,it} from "vitest";
import {facultySessionCoverage,facultySessionCoverageSchema}
  from "@/modules/courses/faculty-session-coverage-model";
describe("Faculty Section session coverage",()=>{
  const now="2026-10-14T10:00:00.000Z";
  it("keeps future unmarked sessions separate from ended unmarked",()=>{
    const result=facultySessionCoverage([
      {id:"a",title:"Past",startsAt:"2026-10-13T09:00:00.000Z",
        endsAt:"2026-10-13T10:00:00.000Z",attendanceStatus:null},
      {id:"b",title:"Marked",startsAt:"2026-10-13T09:00:00.000Z",
        endsAt:"2026-10-13T10:00:00.000Z",attendanceStatus:"MARKED"},
      {id:"c",title:"Future",startsAt:"2026-10-15T09:00:00.000Z",
        endsAt:"2026-10-15T10:00:00.000Z",attendanceStatus:null},
    ],now);
    expect(result).toMatchObject({total:3,marked:1,completedUnmarked:1,upcoming:1,omitted:0});
    expect(result.shown[0]?.label).toBe("Upcoming");
  });
  it("uses a strict Section selector",()=>{
    expect(facultySessionCoverageSchema.safeParse({deliveryId:"invalid"}).success).toBe(false);
  });
});
