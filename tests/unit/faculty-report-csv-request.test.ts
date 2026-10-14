import { describe, expect, it } from "vitest";
import { facultyReportCsvHref, facultyReportCsvRequestSchema } from "@/modules/courses/faculty-report-csv-request";

const id="00000000-0000-4000-8000-000000000001";
const other="00000000-0000-4000-8000-000000000002";
describe("Faculty report download GET request",()=>{
  it("builds exact trusted Section-scoped links for either report kind",()=>{
    expect(facultyReportCsvHref({kind:"quiz",assessmentId:id,deliveryId:other}))
      .toBe("/api/courses/faculty/reports/quiz/"+id+"/csv?deliveryId="+other);
    expect(facultyReportCsvHref({kind:"assignment",assessmentId:other,deliveryId:id}))
      .toContain("/reports/assignment/"+other+"/csv?deliveryId="+id);
  });
  it("rejects missing/untrusted tenant, kind, delivery and assessment selectors",()=>{
    expect(facultyReportCsvRequestSchema.safeParse({kind:"quiz",assessmentId:id}).success).toBe(false);
    expect(facultyReportCsvRequestSchema.safeParse({kind:"quiz",assessmentId:id,deliveryId:other,collegeId:id}).success).toBe(false);
    expect(facultyReportCsvRequestSchema.safeParse({kind:"quiz",assessmentId:id,deliveryId:"invalid"}).success).toBe(false);
    expect(facultyReportCsvRequestSchema.safeParse({kind:"other",assessmentId:id,deliveryId:other}).success).toBe(false);
  });
});
