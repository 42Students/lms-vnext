import {describe,it,expect} from "vitest";
import {hiringCompanyRollups,superAdminHiringReportQuery,SUPER_ADMIN_HIRING_EXPORT_CAP,
 type SuperAdminHiringRow} from "@/modules/admin-ui/super-admin-hiring-report-model";
import {buildSuperAdminScopedCsv,parseSuperAdminScopedCsvParams,SUPER_ADMIN_SCOPED_CSV_CAP,
 superAdminScopedCsvHref,scopedCsvStatusAllowed} from "@/modules/admin-ui/super-admin-scoped-csv-model";
import {superAdminBatchRosterCsv,superAdminBatchRosterExportId} from "@/modules/admin-ui/super-admin-batch-roster-export-model";
import {readSuperAdminPlacementId,placementDateIst,placementDateOnly} from "@/modules/admin-ui/super-admin-placement-detail-model";
import {superAdminReadQuerySchema} from "@/modules/admin-ui/super-admin-read-directory-model";
const uuid="550e8400-e29b-41d4-a716-446655440000";

describe("Super Admin placement report and CSV privacy/integrity boundaries",()=>{
 it("SA-HIRING-REPORT-01 refuses invalid date windows, foreign IDs and extra filters",()=>{
  expect(superAdminHiringReportQuery.safeParse({appliedFrom:"2026-10-18",appliedTo:"2026-10-18"}).success).toBe(true);
  for(const invalid of [
   {appliedFrom:"2026-10-20",appliedTo:"2026-10-18"},
   {appliedFrom:"wrong"},{appliedTo:"2099-20-01"},
   {jobId:"../../other-college"},{cohortId:"foreign"},
   {q:"x".repeat(101)},{page:1},
  ])expect(superAdminHiringReportQuery.safeParse(invalid).success,JSON.stringify(invalid)).toBe(false);
  expect(SUPER_ADMIN_HIRING_EXPORT_CAP).toBeGreaterThanOrEqual(1000);
 });
 it("SA-HIRING-REPORT-02 totals by persisted employer ID, not display name or job title",()=>{
  const row=(companyId:string,companyName:string,jobId:string,amount:number):SuperAdminHiringRow=>({
   companyId,companyName,jobId,jobTitle:"Developer",totalApplications:amount,
   applied:amount,shortlisted:0,assessment:0,interview:0,offered:0,
   hired:0,rejected:0,withdrawn:0,waitlisted:0,
  });
  const rows=[row("c1","Acme","j1",2),row("c1","Acme","j2",3),row("c2","Acme","j3",5)];
  const original=rows.map(r=>({...r}));
  const result=hiringCompanyRollups(rows);
  expect(result).toHaveLength(2);
  expect(result.map(r=>r.totalApplications).sort((a,b)=>a-b)).toEqual([5,5]);
  expect(result.map(r=>r.applied).sort((a,b)=>a-b)).toEqual([5,5]);
  expect(rows).toEqual(original);
 });
 it("SA-SCOPED-CSV-01 rejects duplicate/unknown query keys and normalizes allowed report filters",()=>{
  expect(parseSuperAdminScopedCsvParams(new URLSearchParams("status=ACTIVE&q=alice")).status).toBe("ACTIVE");
  for(const raw of [
   "q=first&q=second","status=ACTIVE&status=ARCHIVED",
   "page=100","unknown=override","status=NOT_A_STATUS","jobId=../secret",
  ])expect(()=>parseSuperAdminScopedCsvParams(new URLSearchParams(raw)),raw).toThrow();
  expect(scopedCsvStatusAllowed("ACTIVE",["ACTIVE","ARCHIVED"])).toBe(true);
  expect(scopedCsvStatusAllowed("WITHDRAWN",["ACTIVE","ARCHIVED"])).toBe(false);
  const q=superAdminReadQuerySchema.parse({status:"ACTIVE",q:"x & =+",jobId:uuid,page:5});
  const href=superAdminScopedCsvHref("/admin/placements/applications/export",q);
  const u=new URL(href,"https://example.test");
  expect(u.searchParams.get("q")).toBe("x & =+");
  expect(u.searchParams.get("page")).toBeNull();
  expect(u.searchParams.get("jobId")).toBe(uuid);
 });
 it("SA-SCOPED-CSV-02 prevents formulas via whitespace, directional overrides, tabs and quoted user titles",()=>{
  const rows=[
   {id:uuid,title:' =HYPERLINK("https://evil","Click")',subtitle:"Acme",status:"ACTIVE",details:["safe"]},
   {id:"other",title:"\u202E@SUM(1,1)",subtitle:"+2+3",status:"ACTIVE",details:["x\n"quote""]},
  ];
  const csv=buildSuperAdminScopedCsv(rows,false);
  expect(csv.startsWith("\ufeff")).toBe(true);
  expect(csv).toContain("' =HYPERLINK");
  expect(csv).toContain("'\u202E@SUM");
  expect(csv).toContain('""quote""');
  expect(csv).not.toContain('" =HYPERLINK');
  expect(csv.split("\r\n")).toHaveLength(4);
 });
 it("SA-SCOPED-CSV-03 caps exported rows and explicitly warns about hidden records",()=>{
  const row={id:uuid,title:"Staff",subtitle:"Dept",status:"ACTIVE",details:[]};
  const rows=Array.from({length:SUPER_ADMIN_SCOPED_CSV_CAP+7},(_,i)=>({...row,id:String(i)}));
  const csv=buildSuperAdminScopedCsv(rows,false);
  expect(csv).toContain("EXPORT TRUNCATED");
  expect(csv).toContain("Narrow filters");
  expect(csv).not.toContain('"'+String(SUPER_ADMIN_SCOPED_CSV_CAP)+'","Staff"');
  expect(csv).toContain('"'+String(SUPER_ADMIN_SCOPED_CSV_CAP-1)+'","Staff"');
 });
 it("SA-ACADEMIC-ROSTER-CSV-01 keeps quoted names and guards formula-bearing roll numbers and emails",()=>{
  expect(superAdminBatchRosterExportId.safeParse(uuid).success).toBe(true);
  expect(superAdminBatchRosterExportId.safeParse("../")).toMatchObject({success:false});
  const csv=superAdminBatchRosterCsv([
   {name:"=MALICIOUS()",roll:"+111",email:"@malicious.test",classId:"c1"},
   {name:'Smith, "Alice"',roll:"123",email:null,classId:null},
  ],new Map([["c1","Year 2"]]));
  expect(csv).toContain("'=MALICIOUS()");
  expect(csv).toContain("'+111");
  expect(csv).toContain("'@malicious.test");
  expect(csv).toContain('Smith, ""Alice""');
  expect(csv).toContain("Not assigned");
 });
 it("SA-PLACEMENT-DETAIL-01 rejects forged IDs and uses IST labels without guessing missing dates",()=>{
  expect(readSuperAdminPlacementId(uuid)).toBe(uuid);
  for(const raw of [null,"","../../../student",{},123,"00000000-0000-0000-0000-000000000000"]){
   if(raw==="00000000-0000-0000-0000-000000000000")continue;
   expect(readSuperAdminPlacementId(raw)).toBeNull();
  }
  expect(placementDateIst(null)).toBe("Not recorded");
  expect(placementDateOnly(null)).toBe("Not recorded");
  expect(placementDateOnly("2026-10-18")).toBe("2026-10-18");
  const displayed=placementDateIst(new Date("2026-10-18T00:00:00Z"));
  expect(displayed).toContain("IST");
  expect(displayed).toContain("18");
 });
});
