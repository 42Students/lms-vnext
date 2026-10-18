import {describe,expect,it} from "vitest";
import {
 superAdminBatchRosterCsv,superAdminBatchRosterExportId,
} from "@/modules/admin-ui/super-admin-batch-roster-export-model";

const batchId="11111111-1111-4111-8111-111111111111";
const sectionId="22222222-2222-4222-8222-222222222222";
const classLabels=new Map([[sectionId,"Section A"]]);
describe("SA-ACADEMICS-BATCH-CSV-02 tenant-safe academic roster export",()=>{
 it("exports a BOM, deterministic four-column headings, proper quotes and Section names",()=>{
  const csv=superAdminBatchRosterCsv([
   {name:'A, "Student"',roll:"23",email:"a@college.edu",classId:sectionId},
   {name:"No class",roll:null,email:null,classId:null},
  ],classLabels);
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain('"Student","Roll No.","Email","Current class"\r\n');
  expect(csv).toContain('"A, ""Student""","23","a@college.edu","Section A"');
  expect(csv).toContain('"No class","","","Not assigned"');
  expect(csv.endsWith("\r\n")).toBe(true);
 });
 it("neutralizes leading invisible and control-prefixed spreadsheet formulas in every exported field",()=>{
  const formulas=[
   "=HYPERLINK(\"https://invalid.example\")",
   " +SUM(1,1)",
   "\t@IMPORTDATA(1)",
   "\u200b=1+1",
   "\u2066=1+2",
   "\uFEFF-CMD",
   "\u202e=hidden",
  ];
  const rows=formulas.map(formula=>({
   name:formula,roll:formula,email:formula,classId:null,
  }));
  const csv=superAdminBatchRosterCsv(rows,new Map());
  for(const formula of formulas){
   const escaped=("'"+formula).replaceAll('"','""');
   expect(csv).toContain('"'+escaped+'"');
  }
  expect(csv).not.toContain('"=HYPERLINK');
  expect(csv).not.toContain('"\u200b=1+1"');
 });
 it("keeps nonformula names and nonexisting class labels truthful",()=>{
  const csv=superAdminBatchRosterCsv([
   {name:"Student name",roll:"001",email:null,classId:batchId},
  ],classLabels);
  expect(csv).toContain('"Student name","001","","Unknown"');
  expect(csv).not.toContain("'Student name");
 });
 it("rejects malformed cohort IDs at the export boundary",()=>{
  expect(superAdminBatchRosterExportId.safeParse(batchId).success).toBe(true);
  for(const id of ["../admin","not-a-uuid","",sectionId+"?college=foreign"]){
   expect(superAdminBatchRosterExportId.safeParse(id).success).toBe(false);
  }
 });
});
