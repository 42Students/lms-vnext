import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {canAccessAnnouncements} from "@/modules/announcements/actor-status-model";
describe("DB10 announcements platform status",()=>{
 it.each(["SUSPENDED","DISABLED","PENDING","", "BLOCKED"])("denies %s",x=>expect(canAccessAnnouncements(x)).toBe(false));
 it("allows active users only",()=>expect(canAccessAnnouncements("ACTIVE")).toBe(true));
 it("enforces platform status in every read/write entry scope",()=>{
  const text=readFileSync("src/modules/announcements/service.ts","utf8");
  expect(text).toMatch(/function requireManage[\s\S]*?canAccessAnnouncements\(context\.user\.platformStatus\)/);
  expect(text).toMatch(/function adminListScope[\s\S]*?canAccessAnnouncements\(context\.user\.platformStatus\)/);
  expect(text).toMatch(/function listAnnouncementTargetOptions[\s\S]*?canAccessAnnouncements\(context\.user\.platformStatus\)/);
 });
});
