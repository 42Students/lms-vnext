import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO-inbox-team-01 detail page read-only contract",()=>{
 const source=readFileSync("src/modules/placements/tpo-recruiter-thread-detail-service.ts","utf8");
 it("scopes through authorized thread IDs and college",()=>{
  expect(source).toContain("listMessageThreads(context,member.collegeId)");
  expect(source).toContain("eq(placementTpoMessageThreads.collegeId,member.collegeId)");
 });
 it("GET details never acknowledge messages",()=>{
  expect(source).not.toContain(".update(");
  expect(source).not.toContain("listThreadMessages(");
 });
});
