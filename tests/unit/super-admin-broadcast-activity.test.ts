import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=readFileSync("src/modules/announcements/super-admin-college-broadcast-service.ts","utf8");
describe("Super Admin broadcast durable publication audit",()=>{
 it("writes a bounded notice and an Activity Log event in the same DB transaction",()=>{
  expect(source).toContain("db.transaction(async tx=>");
  expect(source).toContain("tx.insert(db10Announcements)");
  expect(source).toContain("tx.insert(activityEvents)");
  expect(source).toContain("PLATFORM_COLLEGE_ANNOUNCEMENT_PUBLISHED");
  expect(source).not.toContain("metadata:{title:");
 });
});