import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {collegeCompaniesHref,parseCollegeCompaniesQuery} from "@/modules/placements/college-company-directory-model";
import {safeCollegeCsvCell,collegeCompanyCsv,collegeInterviewCsv} from "@/modules/placements/college-directory-csv";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("COL-placements-R01 college directory and export behavior",()=>{
 it("COL-placements-R01 rejects unsupported company page sizes and preserves validated URL filters",()=>{
  const normal=parseCollegeCompaniesQuery({});
  expect(normal.success).toBe(true);
  if(!normal.success)return;
  expect(normal.data).toMatchObject({page:1,pageSize:10,sort:"LAST_ACTIVE",showDeleted:"0"});
  expect(parseCollegeCompaniesQuery({pageSize:"17"}).success).toBe(false);
  expect(parseCollegeCompaniesQuery({sort:"HIDDEN"}).success).toBe(false);
  expect(parseCollegeCompaniesQuery({showDeleted:"anything"}).success).toBe(false);
  const parsed=parseCollegeCompaniesQuery({q:"Tech",page:"2",pageSize:"50",sort:"DRIVES",showDeleted:"1"});
  expect(parsed.success).toBe(true);
  if(parsed.success)expect(collegeCompaniesHref(parsed.data)).toContain("showDeleted=1");
 });
 it("COL-placements-R01 protects CSV against spreadsheet formula injection",()=>{
  expect(safeCollegeCsvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
  expect(safeCollegeCsvCell("normal")).toBe('"normal"');
  const csv=collegeCompanyCsv([{companyId:"c",name:"Test",industry:null,
   websiteUrl:null,drives:2,companyStatus:"ACTIVE",relationshipStatus:"ARCHIVED"}]);
  expect(csv).toContain("drive count");
  expect(csv).toContain('"Yes"');
  const interview=collegeInterviewCsv([{id:"s",job:"Engineer",student:"Learner",
   kind:"INTERVIEW",status:"SCHEDULED",start:new Date("2099-01-01T05:00:00Z"),
   venue:null,mode:"VIRTUAL"}]);
  expect(interview).toContain("scheduled date (IST)");
  expect(interview).toContain("interviewer");
 });
 it("COL-placements-R01 scopes company listing and both CSV routes to college admin",()=>{
  const service=source("src/modules/placements/college-company-directory-service.ts");
  expect(service).toContain("requireCollegePlacementAdmin(context)");
  expect(service).toContain("eq(placementCompanyRelationships.collegeId,collegeId)");
  expect(service).toContain("ilike(placementCompanies.industry,search)");
  expect(service).toContain("job.college_id =");
  const company=source("src/app/api/college/companies/export/route.ts");
  const interview=source("src/app/api/college/placements/interviews/export/route.ts");
  expect(company).toContain("listCollegeCompanyDirectory(await getCurrentRequestContext()");
  expect(interview).toContain("listCollegeInterviewDirectory(await getCurrentRequestContext()");
  expect(company).toContain("no-store");
  expect(interview).toContain("no-store");
 });
 it("COL-placements-R01 shows filters, factual drive activity and export actions",()=>{
  const page=source("src/app/(authenticated)/college/companies/page.tsx");
  const rows=source("src/components/placements/placement-employer-relationships.tsx");
  const interviews=source("src/app/(authenticated)/college/placements/interviews/page.tsx");
  for(const field of ["name=\"showDeleted\"","name=\"sort\"","name=\"pageSize\"","Export CSV"])
   expect(page).toContain(field);
  expect(rows).toContain("Drives: {item.drives}");
  expect(interviews).toContain('build(1,"csv")');
  expect(interviews).toContain("Export CSV");
 });
});
