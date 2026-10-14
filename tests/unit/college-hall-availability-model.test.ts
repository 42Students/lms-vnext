import { describe, expect, it } from "vitest";
import {
  collegeHallAvailabilitySchema, collegeHallAvailabilityProjection, istWindow,
} from "@/modules/academics/college-hall-availability-model";

const hallId = "70000000-0000-4000-8000-000000000001";
const base = new Date("2026-10-14T04:00:00.000Z");
const end = new Date("2026-10-14T05:00:00.000Z");

describe("College hall availability model", () => {
  it("enforces valid bounded IST dates and disallows caller-selected college", () => {
    expect(collegeHallAvailabilitySchema.parse({hallId,from:"2026-10-14",to:"2026-10-14"}).from).toBe("2026-10-14");
    for (const raw of [
      {hallId,from:"2026-02-30",to:"2026-03-01"},
      {hallId,from:"2026-10-16",to:"2026-10-14"},
      {hallId,from:"2026-10-01",to:"2026-11-02"},
      {hallId,from:"2026-10-14",to:"2026-10-14",collegeId:hallId},
    ]) expect(collegeHallAvailabilitySchema.safeParse(raw).success).toBe(false);
    expect(istWindow("2026-10-14","2026-10-14")).toEqual({
      start:new Date("2026-10-13T18:30:00.000Z"),
      endExclusive:new Date("2026-10-14T18:30:00.000Z"),
    });
  });
  it("flags overlap and configured capacity without inferring learner headcount", () => {
    const rows = [
      {id:"1",sectionId:"s1",sectionName:"A",title:"A",startsAt:base,endsAt:end,sectionCapacity:80},
      {id:"2",sectionId:"s2",sectionName:"B",title:"B",startsAt:new Date("2026-10-14T04:30:00Z"),endsAt:new Date("2026-10-14T05:30:00Z"),sectionCapacity:null},
      {id:"3",sectionId:"s3",sectionName:"C",title:"C",startsAt:new Date("2026-10-14T06:00:00Z"),endsAt:new Date("2026-10-14T07:00:00Z"),sectionCapacity:20},
    ];
    const result = collegeHallAvailabilityProjection(60,rows);
    expect(result.map(x=>x.hasConflict)).toEqual([true,true,false]);
    expect(result[0].overConfiguredCapacity).toBe(true);
    expect(result[1].sectionCapacity).toBeNull();
    expect(result[1].overlapsAnother).toBe(true);
    expect(result[2].startsAt).toBe("2026-10-14T06:00:00.000Z");
  });
});
