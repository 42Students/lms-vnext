import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const service=readFileSync("src/modules/announcements/service.ts","utf8");
describe("Super Admin single DB10 announcement Activity Log contract",()=>{
 it("uses one transaction for notice and activity rows",()=>{
  const start=service.indexOf("export async function createAnnouncement(");
  const stop=service.indexOf("export async function listAnnouncementsForAdmin(",start);
  const body=service.slice(start,stop);
  expect(body).toContain("getDb().transaction(async tx =>");
  expect(body).toContain("tx.insert(db10Announcements)");
  expect(body).toContain("tx.insert(activityEvents)");
  expect(body).toContain("PLATFORM_COLLEGE_ANNOUNCEMENT_PUBLISHED");
 });
 it("records metadata without publication content or personal contacts",()=>{
  const start=service.indexOf('metadata: { noticeId: created.id');
  const metadata=service.slice(start,start+90);
  expect(metadata).not.toContain("email");
  expect(metadata).not.toContain("message");
 });
});
