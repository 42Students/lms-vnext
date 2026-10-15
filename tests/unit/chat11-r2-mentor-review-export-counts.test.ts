import {expect,it} from "vitest";
import {mentorReviewExportCsv} from "@/modules/projects/mentor-review-export-model";
const row={projectId:"11111111-1111-4111-8111-111111111111",projectTitle:"Capstone Project",occurredAt:new Date("2026-10-15T11:00:00Z")};
it("never exposes NaN or Infinity as a phantom omitted record count",()=>{
 expect(mentorReviewExportCsv([row],Number.NaN)).not.toContain("NaN");
 expect(mentorReviewExportCsv([row],Number.POSITIVE_INFINITY)).not.toContain("Infinity");
});
it("caps private-context exports to 200 assigned projects and discloses truncation",()=>{
 const csv=mentorReviewExportCsv(Array.from({length:201},(_,i)=>({...row,projectId:String(i)})),0);
 expect(csv).toContain("1 more matching deliveries");
 expect(csv.split("\r\n").filter(Boolean)).toHaveLength(202);
 expect(csv).not.toContain("learner@example.com");
});
