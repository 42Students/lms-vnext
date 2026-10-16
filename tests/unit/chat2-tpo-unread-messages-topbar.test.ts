import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO-inbox-team-03 unread message topbar badge",()=>{
 const source=readFileSync("src/modules/placements/tpo-recruiter-unread-count-service.ts","utf8");
 it("counts unread recruiter messages within the authenticated college only",()=>{
  expect(source).toContain('eq(placementTpoMessageThreads.collegeId,member.collegeId)');
  expect(source).toContain('eq(placementTpoMessages.senderType,"RECRUITER")');
  expect(source).toContain("isNull(placementTpoMessages.readAt)");
 });
 it("GET/topbar read never acknowledges or loads bodies",()=>{
  expect(source).not.toContain(".update(");
  expect(source).not.toContain("placementTpoMessages.body");
 });
});
