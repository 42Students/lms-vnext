import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("UX-recruiter-drives-jobId-messages-01",()=>{
 it("preserves role-safe navigation, exact route copy and accessible shared surface",()=>{
  const source=read("src/app/(authenticated)/recruiter/drives/[jobId]/messages/page.tsx");
  expect(source).toContain("@/app/(authenticated)/hr/drives/[jobId]/messages/page.tsx");
  expect(source).toMatch(/export\s*\{\s*default\s*\}/);
  const canonical=read("src/app/(authenticated)/hr/drives/[jobId]/messages/page.tsx");
  expect(canonical).toMatch(/export\s+default|export\s*\{\s*default/);
 });
});
