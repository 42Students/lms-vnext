import {describe,expect,it} from "vitest";
import {
 parseCollegeImportCsv,MAX_COLLEGE_IMPORT_ROWS,collegeImportInputSchema,
} from "@/modules/colleges/bulk-import-model";
const head="name,code,city,state,country";
const csv=(...lines:string[])=>head+"\n"+lines.join("\n");

describe("Super Admin college bulk import adversarial input grammar",()=>{
 it("SA-colleges-bulk-input-01 preserves quoted commas and quotes but rejects trailing characters after quote",()=>{
  const rows=parseCollegeImportCsv(csv('"School, with name",CLG-A,Hubballi,Karnataka,India'));
  expect(rows).toMatchObject([{line:2,name:"School, with name",code:"CLG-A",
   city:"Hubballi",state:"Karnataka",country:"India"}]);
  const quote=parseCollegeImportCsv(csv('"School ""42""",CLG-B,,,'));
  expect(quote[0]?.name).toBe('School "42"');
  for(const raw of [
   csv('"School"malicious,CLG-C,,,'),
   csv('"School"\t,CLG-C,,,'),
   csv('"School'),
   csv('School"broken",CLG-C,,,'),
  ])expect(()=>parseCollegeImportCsv(raw)).toThrow();
 });

 it("SA-colleges-bulk-input-02 never trusts a forged organization field in the CSV request",()=>{
  const body={organizationId:"11111111-1111-4111-8111-111111111111",csv:csv("Valid,CLG-A,,,")};
  expect(collegeImportInputSchema.safeParse(body).success).toBe(true);
  expect(collegeImportInputSchema.safeParse({...body,requestedOrganizationId:"22222222-2222-4222-8222-222222222222"}).success).toBe(false);
  expect(collegeImportInputSchema.safeParse({...body,organizationId:"attacker"}).success).toBe(false);
  expect(collegeImportInputSchema.safeParse({...body,csv:"x".repeat(150001)}).success).toBe(false);
 });

 it("SA-colleges-bulk-input-03 rejects duplicate codes independent of case and enforces row cap",()=>{
  expect(()=>parseCollegeImportCsv(csv("College A,CODE,,,","College B,code,,,")))
   .toThrow("Duplicate college code");
  expect(MAX_COLLEGE_IMPORT_ROWS).toBe(200);
  const rows=Array.from({length:201},(_,i)=>"College "+i+",C-"+i+",,,");
  expect(()=>parseCollegeImportCsv(csv(...rows))).toThrow("at most 200");
  expect(parseCollegeImportCsv(csv(...rows.slice(0,200)))).toHaveLength(200);
 });

 it("SA-colleges-bulk-input-04 fails malformed or oversized rows instead of silently dropping cells",()=>{
  for(const bad of [
   csv(",CLG-A,,,"),
   csv("College A,,,,"),
   csv("College A,CLG-A,,,Extra,Injection"),
   csv("a".repeat(256)+",CLG-A,,,"),
   csv("College A,"+"X".repeat(65)+",,,"),
  ])expect(()=>parseCollegeImportCsv(bad)).toThrow();
 });
});
