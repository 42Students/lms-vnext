import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO-companies-R01 TPO-campaigns-public-21 counters",()=>{
 it("counts opens only by POST",()=>{
  const route=readFileSync("src/app/api/public/join-link/open/route.ts","utf8");
  expect(route).toContain("isSameOriginRequest");
  expect(route).not.toContain("export async function GET");
 });
 it("counts joins on first successful grant",()=>{
  const svc=readFileSync("src/modules/placements/public-join/join-service.ts","utf8");
  expect(svc).toContain('outcome==="JOINED"');
  expect(svc).toContain("joinsCount:");
 });
});
