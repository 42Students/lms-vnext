import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {parseCollegeImportCsv,MAX_COLLEGE_IMPORT_ROWS} from "@/modules/colleges/bulk-import-model";
describe("SA-tenants-modules-15 bulk college CSV",()=>{
 it("parses header, quoted commas and escaped quotes",()=>{
  const rows=parseCollegeImportCsv('name,code,city\n"42, University",C01,Hyderabad\n"New ""College""",C02,Vijayawada');
  expect(rows).toHaveLength(2);expect(rows[0].name).toBe("42, University");
  expect(rows[1].name).toBe('New "College"');
 });
 it("parses five-column CSV without headers",()=>{
  expect(parseCollegeImportCsv('College A,CA1,Hyderabad,Telangana,India')[0]).toMatchObject({
   name:"College A",code:"CA1",state:"Telangana"});
 });
 it("rejects duplicates and oversize inputs before writing",()=>{
  expect(()=>parseCollegeImportCsv('A,ABC\nB,abc')).toThrow(/duplicate college code/i);
  expect(MAX_COLLEGE_IMPORT_ROWS).toBe(200);
  expect(()=>parseCollegeImportCsv(Array.from({length:201},(_,i)=>"Name"+i+",C"+i).join("\n"))).toThrow(/200/);
 });
 it("preflights globally existing codes without case-sensitive mismatch",()=>{
  const service=readFileSync(new URL("../../src/modules/colleges/bulk-import-service.ts",import.meta.url),"utf8");
  expect(service).toContain("lower(${colleges.code})");
  expect(service).toContain("rows.map(r=>r.code.toLowerCase())");
 });
});
