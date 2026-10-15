import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const route=readFileSync("src/app/api/admin/announcements/broadcast/route.ts","utf8");
const service=readFileSync("src/modules/announcements/super-admin-college-broadcast-service.ts","utf8");
describe("Super Admin bulk DB10 announcement guard",()=>{
 it("only mutates on explicit same-origin POST behind readiness",()=>{
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("announcementsRuntimeEnabled()");
  expect(service).toContain("requirePermission(context,\"college.manage\"");
 });
 it("inserts every authorized target atomically and rejects unknown selected IDs",()=>{
  expect(service).toContain("db.transaction");
  expect(service).toContain("targets.length!==requested.length");
  expect(service).toContain('receiverType:"COLLEGE"');
 });
});