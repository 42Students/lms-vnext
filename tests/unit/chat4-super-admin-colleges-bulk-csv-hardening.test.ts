import {describe,expect,it} from "vitest";
import {
  MAX_COLLEGE_IMPORT_ROWS,collegeImportInputSchema,parseCollegeImportCsv,
} from "@/modules/colleges/bulk-import-model";

describe("Super Admin colleges bulk CSV adversarial parser",()=>{
 it("SA-colleges-bulk-input-01 preserves commas, escaped quotes and CRLF while normalizing BOM",()=>{
  const rows=parseCollegeImportCsv('\uFEFFname,code,city,state,country\r\n"College, Central",CC-1,"St. ""James""",Andhra Pradesh,India\r\n');
  expect(rows).toEqual([{line:2,name:"College, Central",code:"CC-1",city:'St. "James"',state:"Andhra Pradesh",country:"India"}]);
  const headerless=parseCollegeImportCsv("College Two,CT-2,City,AP,India");
  expect(headerless).toEqual([{line:1,name:"College Two",code:"CT-2",city:"City",state:"AP",country:"India"}]);
 });

 it("SA-colleges-bulk-input-02 rejects malformed quote tails and unterminated cells instead of creating a different tenant",()=>{
  for(const csv of [
   'name,code,city\n"College"INJECTED,CCC,Town',
   'name,code,city\n"Unclosed,CCC,Town',
   'name,code\nCol"lege,CC3',
   'name,code,city\nCollege,CC4,"Town"x',
  ])expect(()=>parseCollegeImportCsv(csv)).toThrow(/CSV quote/);
 });

 it("SA-colleges-bulk-input-03 enforces 200 rows, no case-variant duplicate codes, required names and correct lengths",()=>{
  expect(MAX_COLLEGE_IMPORT_ROWS).toBe(200);
  expect(parseCollegeImportCsv(
   "name,code\n"+Array.from({length:200},(_,i)=>"College "+i+",C"+i).join("\n")
  )).toHaveLength(200);
  expect(()=>parseCollegeImportCsv(
   "name,code\n"+Array.from({length:201},(_,i)=>"College "+i+",C"+i).join("\n")
  )).toThrow("at most 200");
  expect(()=>parseCollegeImportCsv("name,code\nFirst,ABC\nSecond,abc"))
   .toThrow("Duplicate college code");
  expect(()=>parseCollegeImportCsv("name,code\n,COLLEGE1")).toThrow("required");
  expect(()=>parseCollegeImportCsv("name,code\n"+"X".repeat(256)+",C")).toThrow("required");
  expect(()=>parseCollegeImportCsv("name,code\nA,"+"C".repeat(65))).toThrow("required");
  expect(()=>parseCollegeImportCsv("name,code\nA,B,C")).toThrow("too many columns");
 });

 it("SA-colleges-bulk-input-04 the transport request refuses unknown tenant keys and oversized/unconfirmed payload shapes",()=>{
  const organizationId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  expect(collegeImportInputSchema.safeParse({organizationId,csv:"Name,Code"}).success).toBe(true);
  for(const raw of [
   {organizationId,csv:"Name,Code",collegeId:"forged"},
   {organizationId:"not-a-uuid",csv:"Name,Code"},
   {organizationId,csv:""},
   {organizationId,csv:"x".repeat(150001)},
  ])expect(collegeImportInputSchema.safeParse(raw).success).toBe(false);
 });
});
