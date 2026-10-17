import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
describe("Legacy recruiter entrypoints",()=>{
 it("REC-calendar-messages-profile-47 redirects /recruiter to the canonical Today landing",()=>{
  expect(src("src/app/(authenticated)/recruiter/page.tsx")).toContain('redirect("/hr/home")');
 });
 it("REC-calendar-messages-profile-47 resolves the retired colleges page to Today rather than an unresolved route",()=>{
  expect(src("src/app/(authenticated)/recruiter/colleges/page.tsx")).toContain('redirect("/hr/home")');
 });
});
