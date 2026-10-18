import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("PROJ-BREAK-SA-38 lock request input safety",()=>{
 it("requires same-origin and a bounded JSON body before any project write",()=>{
  const route=readFileSync("src/app/api/projects/[projectId]/submissions/[submissionId]/lock/route.ts","utf8");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("Number.isSafeInteger(length)");
  expect(route).toContain("length>8192");
  expect(route).toContain("text.length>8192");
  expect(route).toContain("JSON.parse(text)");
  expect(route.indexOf("JSON.parse(text)")).toBeLessThan(route.indexOf("getCurrentRequestContext()"));
  expect(route).toContain('error:"INVALID_REQUEST"');
  expect(route).toContain('Cache-Control":"private, no-store"');
 });
});
