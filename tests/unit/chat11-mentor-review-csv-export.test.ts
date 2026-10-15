import {expect,it} from "vitest";
import {mentorReviewExportCsv} from "@/modules/projects/mentor-review-export-model";
it("exports only safe assigned-project review metadata and caps transparently",()=>{
 const csv=mentorReviewExportCsv([{projectId:"11111111-1111-4111-8111-111111111111",
  projectTitle:"=EXFILTRATE()",occurredAt:new Date("2026-10-15T03:30:00Z")}],4);
 expect(csv).toContain("'=EXFILTRATE()");
 expect(csv).toContain("Final delivery awaiting review");
 expect(csv).toContain("4 more matching deliveries");
 expect(csv).not.toContain("candidateEmail");
});
