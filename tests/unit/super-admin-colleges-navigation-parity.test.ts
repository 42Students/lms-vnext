import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=readFileSync("src/app/(authenticated)/admin/colleges/page.tsx","utf8");
describe("College setup links across responsive views",()=>{
 it("renders scoped tenant setup links in desktop and mobile",()=>{
  expect((src.match(/Tenant setup/g)||[]).length).toBeGreaterThanOrEqual(2);
  expect(src).toContain("encodeURIComponent(college.id)");
 });
 it("has both branding and readiness in mobile cards",()=>{
  const mobile=src.split('aria-label="College onboarding cards"')[1]||"";
  expect(mobile).toContain("Branding");
  expect(mobile).toContain("Readiness");
 });
});
