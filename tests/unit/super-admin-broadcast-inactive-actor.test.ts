import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
describe("DB10 broadcast actor status guard",()=>{
 it("denies inactive actors before loading broadcast colleges",()=>{
  const source=readFileSync("src/modules/announcements/super-admin-college-broadcast-service.ts","utf8");
  expect(source).toContain('!isSuperAdmin(context)||!canAccessAnnouncements(context.user.platformStatus))throw new AuthorizationError("college.read")');
 });
 it("denies inactive actors before publishing college notices",()=>{
  const source=readFileSync("src/modules/announcements/super-admin-college-broadcast-service.ts","utf8");
  expect(source).toContain('!isSuperAdmin(context)||!canAccessAnnouncements(context.user.platformStatus))throw new AuthorizationError("college.manage")');
  expect(source.indexOf('AuthorizationError("college.manage")')).toBeLessThan(source.indexOf("db.transaction(async tx=>"));
 });
});
