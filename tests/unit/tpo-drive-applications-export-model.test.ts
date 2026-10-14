import {describe,expect,it} from "vitest";
import {projectTpoDriveApplicationsExport,tpoDriveApplicationsExportQuerySchema,
 TPO_DRIVE_APPLICATION_EXPORT_LIMIT,tpoApplicantExportSearchPattern} from "@/modules/placements/tpo-drive-applications-export-model";
describe("TPO applicant CSV cap and injection safety",()=>{
 it("validates filters, escapes SQL wildcard characters and displays IST dates",()=>{
  const id="550e8400-e29b-41d4-a716-446655440000";
  expect(tpoDriveApplicationsExportQuerySchema.parse({jobId:id})).toMatchObject({stage:"ALL",search:"",channel:"ALL"});
  expect(tpoDriveApplicationsExportQuerySchema.safeParse({jobId:id,channel:"OTHER"}).success).toBe(false);
  expect(tpoDriveApplicationsExportQuerySchema.parse({jobId:id,eligibility:"ELIGIBLE"}).eligibility).toBe("ELIGIBLE");
  expect(tpoDriveApplicationsExportQuerySchema.safeParse({jobId:id,eligibility:"DISQUALIFIED"}).success).toBe(false);
  expect(tpoDriveApplicationsExportQuerySchema.safeParse({jobId:id,stage:"SELECTED"}).success).toBe(false);
  expect(tpoApplicantExportSearchPattern("50%_\\")).toBe("%50\\%\\_\\\\%");
  const csv=projectTpoDriveApplicationsExport([{applicationId:"a",studentName:"Candidate",roleTitle:"Role",
   status:"SUBMITTED",screeningStatus:null,channel:"INTERNAL",submittedAt:"2026-10-14T20:00:00Z"}],"Drive").csv;
  expect(csv).toContain("Submitted (IST)");
  expect(csv).toContain("15/10/2026");
 });
 it("neutralizes malicious student and role spreadsheet prefixes",()=>{
  const report=projectTpoDriveApplicationsExport([{
   applicationId:"a",studentName:"=HYPERLINK(1)",roleTitle:"+ROLE",
   status:"SUBMITTED",screeningStatus:"PENDING",channel:"INTERNAL",
   submittedAt:"2026-10-14T14:00:00Z",
  }],"Employer");
  expect(report.csv).toContain("'=HYPERLINK(1)");
  expect(report.csv).toContain("'+ROLE");
  expect(report.truncated).toBe(false);
  expect(tpoDriveApplicationsExportQuerySchema.safeParse({jobId:"not a uuid"}).success).toBe(false);
 });
 it("caps rows and places an honest visible truncation notice",()=>{
  const rows=Array.from({length:TPO_DRIVE_APPLICATION_EXPORT_LIMIT+1},(_,i)=>({
   applicationId:String(i),studentName:"Candidate "+i,roleTitle:"Engineer",
   status:"SUBMITTED",screeningStatus:null,channel:"INTERNAL",
   submittedAt:"2026-10-14T14:00:00Z",
  }));
  const report=projectTpoDriveApplicationsExport(rows,"Employer");
  expect(report.rows).toHaveLength(500);
  expect(report.truncated).toBe(true);
  expect(report.csv).toContain("TRUNCATED");
  expect(report.csv).toContain("further matching applications exist");
 });
});
