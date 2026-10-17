import {describe,it,expect} from "vitest";
import {collegeActivityActor,collegeActivityItem,collegeActivityAction} from "@/modules/activity/college-activity-presentation";
import {readFileSync} from "node:fs";
describe("chat-14 final sprint",()=>{
 it("COL-verification-misc-13 verifies readable actor, item and action projection",()=>{
  expect(collegeActivityActor(null)).toBe("System");
  expect(collegeActivityActor({id:"00000000-0000-0000-0000-000000abc123",displayName:"Dr Shah"})).toBe("Dr Shah");
  expect(collegeActivityItem({subjectLabel:"Assignment Quiz 2",subjectType:"course_content",subjectId:"abc1234"})).toBe("Assignment Quiz 2");
  expect(collegeActivityAction("placements.drive.approved")).toBe("Drive Approved");
  const page=readFileSync("src/app/(authenticated)/college/activity/page.tsx","utf8");
  expect(page).toContain("collegeActivityActor(");
  expect(page).toContain("collegeActivityItem(");
  expect(page).toContain("collegeActivityAction(");
 });
});