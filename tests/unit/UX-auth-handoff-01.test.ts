import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("UX-auth-handoff-01 retired legacy handoff",()=>{
 it("never displays or redeems deprecated cross-host tokens",()=>{
  const route=readFileSync("src/app/auth/handoff/page.tsx","utf8");
  expect(route).toContain('redirect("/?auth=handoff-retired")');
  expect(route).not.toContain("searchParams");
  expect(route).not.toContain("fetch(");
  expect(route).not.toContain("<form");
 });
 it("routes users back to safe first-party OTP guidance",()=>{
  const home=readFileSync("src/app/page.tsx","utf8");
  expect(home).toContain('"handoff-retired"');
  expect(home).toContain("Sign in with a fresh one-time code");
 });
});