import {describe,it,expect} from "vitest";
import {lectureHallsCsvSchema,lectureHallsCsvHref,renderLectureHallsCsv,exportParams}
 from "@/modules/academics/college-lecture-halls-export-model";
describe("college lecture halls CSV",()=>{
 it("bounds hall filters without permitting a caller-selected college",()=>{
  expect(lectureHallsCsvSchema.safeParse({collegeId:"foreign"}).success).toBe(false);
  expect(lectureHallsCsvSchema.safeParse({page:2}).success).toBe(false);
  expect(lectureHallsCsvSchema.safeParse({minimumCapacity:0}).success).toBe(false);
  expect(exportParams(new URLSearchParams("status=ALL&status=ARCHIVED"))).toBeNull();
  const q=lectureHallsCsvSchema.parse({roomType:"LAB",minimumCapacity:50});
  expect(lectureHallsCsvHref(q)).toContain("minimumCapacity=50");
 });
 it("neutralizes room names, never infers occupancy, labels counts as scheduled",()=>{
  const csv=renderLectureHallsCsv([{
   name:"=hall",capacity:100,roomType:"LAB",status:"ACTIVE",
   departmentName:"+unsafe",upcomingClasses:0,
  }],true);
  expect(csv).toContain("\"'=hall\"");
  expect(csv).toContain("\"'+unsafe\"");
  expect(csv).toContain("Upcoming scheduled classes");
  expect(csv).toContain("EXPORT TRUNCATED");
 });
});
