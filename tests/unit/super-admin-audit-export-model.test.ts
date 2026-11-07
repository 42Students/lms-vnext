import {describe,expect,it} from "vitest";
import {buildSuperAdminAuditCsv,superAdminAuditExportSchema,SUPER_ADMIN_AUDIT_CSV_CAP}
 from "@/modules/activity/super-admin-audit-export-model";
describe("Super Admin audit export",()=>{
 it("strictly accepts only filters, no forged scope or cursor",()=>{
  for(const q of [{collegeId:"any"},{organizationId:"any"},{beforeId:"x"},{module:"OTHER"},{subjectId:"x".repeat(501)}])
   expect(superAdminAuditExportSchema.safeParse(q).success).toBe(false);
  expect(superAdminAuditExportSchema.safeParse({module:"COURSES",from:"2026-10-14",to:"2026-10-14",
   collegeId:"10000000-0000-4000-8000-000000000001",subjectId:"test"}).success).toBe(true);
 });
 it("uses IST calendar time and escapes formulas, quotes and newlines",()=>{
  const csv=buildSuperAdminAuditCsv([{occurredAt:new Date("2026-10-14T18:30:00.000Z"),
   module:"PLATFORM",importance:"HIGH",eventType:"test",subjectType:"test",
   subjectId:"=9+1",subjectLabel:"@foo",summary:'=HYPERLINK("x")',actorName:"+INJECT"}],true);
  expect(csv).toContain("15/10/2026");
  expect(csv).toContain("'=HYPERLINK");
  expect(csv).toContain("'+INJECT");
  expect(csv).toContain("EXPORT TRUNCATED");
  expect(csv).toContain(String(SUPER_ADMIN_AUDIT_CSV_CAP));
  expect(csv).not.toContain("Actor Email");
  const controlPrefix = buildSuperAdminAuditCsv([{
   occurredAt:new Date("2026-10-14T18:30:00.000Z"),
   module:"PLATFORM",importance:"HIGH",eventType:"test",subjectType:"test",
   subjectId:"\u2066=9+1",subjectLabel:"\u0301@title",
   summary:"\u200b=FORMULA",actorName:"\u0001+INJECT",
  }],false);
  for (const prefix of ["\u2066=9+1", "\u200b=FORMULA", "\u0001+INJECT"]) {
   expect(controlPrefix).toContain("\"'"+prefix+"\"");
  }
  expect(controlPrefix).not.toContain("Actor Email");
  const row = {
   occurredAt:new Date("2026-10-14T18:30:00.000Z"),
   module:"PLATFORM",importance:"HIGH",eventType:"test",subjectType:"test",
   subjectId:"opaque",subjectLabel:"opaque",summary:"safe",actorName:"System",
  };
  const excessive = buildSuperAdminAuditCsv(
   Array.from({length:SUPER_ADMIN_AUDIT_CSV_CAP+1},()=>row),false);
  expect(excessive.split("\r\n")).toHaveLength(SUPER_ADMIN_AUDIT_CSV_CAP+2);
  expect(excessive).toContain("EXPORT TRUNCATED");
 });
});
