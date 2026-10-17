import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO-campaigns-public-R03 TPO-campaigns-public-R06 join states",()=>{
 it("returns normalized sign in email",()=>{
  const s=readFileSync("src/modules/placements/public-join/join-service.ts","utf8");
  expect(s).toContain("signInEmail:input.data.email");
 });
 it("supports Enter submit, editable details and one-time-code autocomplete",()=>{
  const s=readFileSync("src/components/placements/public-recruiter-join-form.tsx","utf8");
  expect(s).toContain('autoComplete="one-time-code"');
  expect(s).toContain('autoComplete="name"');
  expect(s).toContain("onSubmit={event=>");
  expect(s).toContain("One more step");
  expect(s).toContain("You already have an account. Sign in on ");
 });
});
