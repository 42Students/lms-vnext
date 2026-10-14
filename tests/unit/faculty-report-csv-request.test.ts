import { describe, expect, it } from "vitest";
import {
  facultyReportCsvHref, facultyReportCsvRequestSchema,
  facultyCsvAttachmentHeaders, parseFacultyCsvDownloadUrl,
} from "@/modules/courses/faculty-report-csv-request";

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
  it("rejects duplicate, absent and forged GET query selectors instead of dropping them",()=>{
    const path={kind:"quiz",assessmentId:id};
    const route="https://lms.example/api/courses/faculty/reports/quiz/"+id+"/csv";
    expect(parseFacultyCsvDownloadUrl(route+"?deliveryId="+other,path))
      .toEqual({kind:"quiz",assessmentId:id,deliveryId:other});
    for(const query of [
      "", "?deliveryId="+other+"&deliveryId="+id,
      "?deliveryId="+other+"&collegeId="+id,
      "?audience=all&deliveryId="+other,
    ]) {
      expect(()=>parseFacultyCsvDownloadUrl(route+query,path)).toThrow();
    }
  });
  it("adds no-store headers and refuses an untrusted Content-Disposition filename",()=>{
    expect(facultyCsvAttachmentHeaders("faculty-quiz-report-section-a.csv")).toMatchObject({
      "Cache-Control":"private, no-store, max-age=0",
      "X-Content-Type-Options":"nosniff",
      "Content-Disposition":'attachment; filename="faculty-quiz-report-section-a.csv"',
    });
    expect(()=>facultyCsvAttachmentHeaders("unsafe\\r\\nfile.csv")).toThrow();
  });
});
