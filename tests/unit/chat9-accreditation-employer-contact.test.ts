import {describe,it,expect} from "vitest";
import {buildAccreditationStudentRows,accreditationStudentCsv} from "../../src/modules/placements/tpo-accreditation-students-model";
describe("NAAC employer contact disclosure",()=>{
 it("TPO-calendar-reports-R04 uses a recorded college company relationship email rather than a learner contact",()=>{
  const student=buildAccreditationStudentRows([{membershipId:"learner",offerId:"offer",name:"Learner",
   rollNumber:"2099-01",programme:"B.Tech",branch:"CSE",batch:"2099",company:"Company",
   status:"ACCEPTED",annualCtcInr:1200000,joining:null,
   employerContact:"recruiter@example.com"}])[0];
  expect(student?.employerContact).toBe("recruiter@example.com");
  expect(accreditationStudentCsv([student!])).toContain("recruiter@example.com");
 });
 it("TPO-calendar-reports-R04 leaves missing employer emails unavailable, never substitutes student PII",()=>{
  const rows=buildAccreditationStudentRows([{membershipId:"learner",offerId:"offer",name:"Learner",
   rollNumber:null,programme:"B.Tech",branch:"CSE",batch:"2099",company:"Company",
   status:"ACCEPTED",annualCtcInr:null,joining:null}]);
  expect(rows[0]?.employerContact).toBeNull();
 });
});