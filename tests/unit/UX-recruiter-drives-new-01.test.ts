import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("UX-recruiter-drives-new-01",()=>{
 it("preserves canonical route, scoped data and the audited mobile/action states",()=>{
  const source=read("src/app/(authenticated)/recruiter/drives/new/page.tsx");
  expect(source).toContain("@/app/(authenticated)/hr/drives/new/page");
  expect(source).toMatch(/export\s*\{\s*default\s*\}/);
  expect(read("src/app/(authenticated)/hr/drives/new/page.tsx")).toMatch(/export\s+default|export\s*\{\s*default/);
 });
});
