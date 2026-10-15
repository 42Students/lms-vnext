import {it,expect} from "vitest";import {readFileSync} from "node:fs";
it("exposes grading review from an authorized persisted assignment report",()=>{
 const src=readFileSync("src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx","utf8");
 expect(src).toContain("facultyAiGradingHref({");
 expect(src).toContain("assignmentId:assignment.id,deliveryId:assignment.deliveryId");
 expect(src).toContain("AI grading review (suggestions disabled)");
});
