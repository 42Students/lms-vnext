import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const pages=[
 "src/app/(authenticated)/tracker/issues/page.tsx",
 "src/app/(authenticated)/tracker/issues/[publicId]/page.tsx",
 "src/app/(authenticated)/tracker/audit-findings/page.tsx",
];
describe("DB10 tracker Super Admin active account route fences",()=>{
 it.each(pages)("blocks inactive actors before database readiness on %s",path=>{
  const content=readFileSync(path,"utf8");
  expect(content).toMatch(/platformStatus\s*!==\s*"ACTIVE"/);
  expect(content.indexOf('redirect("/dashboard")')).toBeLessThan(content.indexOf("trackerAdminRuntimeEnabled()"));
 });
});
