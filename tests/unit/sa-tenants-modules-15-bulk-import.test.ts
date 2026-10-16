import {describe,it,expect} from "vitest";
import {parseCollegeImportCsv,MAX_COLLEGE_IMPORT_ROWS} from "@/modules/colleges/bulk-import-model";
describe("SA-tenants-modules-15 bulk college CSV",()=>{
 it("parses header, quoted commas and escaped quotes",()=>{
  const rows=parseCollegeImportCsv('name,code,city\n"42, University",C1,Hyderabad\n"New ""College""",C2,Vijayawada');
  expect(rows).toHaveLength(2);expect(rows[0].name).toBe("42, University");
  expect(rows[1].name).toBe('New "College"');
 });
 it("parses five-column CSV without headers",()=>{
  expect(parseCollegeImportCsv('College A,CA,Hyderabad,Telangana,India')[0]).toMatchObject({
   name:"College A",code:"CA",state:"Telangana"});
 });
 it("rejects duplicates and oversize inputs before writing",()=>{
  expect(()=>parseCollegeImportCsv('A,ABC\nB,abc')).toThrow(/Duplicate/);
  expect(MAX_COLLEGE_IMPORT_ROWS).toBe(200);
  expect(()=>parseCollegeImportCsv(Array.from({length:201},(_,i)=>"Name"+i+",C"+i).join("\n"))).toThrow(/200/);
 });
});
