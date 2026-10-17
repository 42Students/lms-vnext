import {describe,expect,it} from "vitest";
import {buildAccreditationStudentRows,accreditationStudentCsv} from "@/modules/placements/tpo-accreditation-students-model";
const base={membershipId:"a",name:"Akhil",rollNumber:"R101",programme:"BTech",
 branch:"CSE",batch:"2026",company:"Example",joining:"PENDING"};
describe("TPO-calendar-reports-33 NAAC student evidence",()=>{
 it("emits one row per placed student, best accepted CTC and offer count",()=>{
  const rows=buildAccreditationStudentRows([
   {...base,offerId:"1",status:"ACCEPTED",annualCtcInr:900000},
   {...base,offerId:"2",status:"ACCEPTED",annualCtcInr:1100000,company:"BigCo",joining:"JOINED"},
   {...base,offerId:"3",status:"ISSUED",annualCtcInr:1500000},
   {...base,membershipId:"b",offerId:"4",status:"ISSUED",annualCtcInr:2000000},
  ]);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({employer:"BigCo",packageInr:1100000,offersHeld:3,joining:"JOINED"});
  expect(rows[0].employerContact).toBeNull();
 });
 it("never exports duplicate accepted offers or spreadsheet formulas unsafely",()=>{
  const rows=buildAccreditationStudentRows([
   {...base,offerId:"1",name:"=IMPORTXML()",status:"ACCEPTED",annualCtcInr:null},
   {...base,offerId:"1",name:"=IMPORTXML()",status:"ACCEPTED",annualCtcInr:null},
  ]);
  expect(rows[0].offersHeld).toBe(1);
  const csv=accreditationStudentCsv(rows);
  expect(csv).toContain("Employer contact");
  expect(csv).toContain("'=IMPORTXML()");
  expect(csv.split("\r\n")[0]).toContain("Employer contact");
  expect(csv.split("\r\n")).toHaveLength(2);
  expect(csv).not.toContain("\"=IMPORTXML()\"");
 });
});
