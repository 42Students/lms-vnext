import { it, expect } from "vitest";
import { exportTpoBatchStudentsCsv } from "@/modules/placements/tpo-batch-students-export-model";
it("exports the reviewed page with extra, formula-neutralized audit fields",()=>{
 const csv=exportTpoBatchStudentsCsv([{membershipId:"123",name:"=SUM(1)",decision:"INELIGIBLE",
  source:"LEARNER",reason:"Needs, review",ambiguous:false}]);
 expect(csv).toContain('"Membership reference"');
 expect(csv).toContain("'=SUM(1)");
 expect(csv).toContain('"Needs, review"');
 expect(csv.endsWith("\r\n")).toBe(true);
});
