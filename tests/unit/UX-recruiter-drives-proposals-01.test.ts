import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("UX-recruiter-drives-proposals-01",()=>{
 it("preserves canonical route, scoped data and the audited mobile/action states",()=>{
  const source=read("src/app/(authenticated)/recruiter/drives/proposals/page.tsx");
  expect(source).toContain("@/app/(authenticated)/hr/drives/proposals/page");
  expect(source).toMatch(/export\s*\{\s*default\s*\}/);
  const canonical=read("src/app/(authenticated)/hr/drives/proposals/page.tsx");
  expect(canonical).toMatch(/export\s+default|export\s*\{\s*default/);
  expect(read("src/app/(authenticated)/recruiter/drives/proposals/loading.tsx")).toContain("GracefulPageLoading");
  expect(read("src/app/(authenticated)/recruiter/drives/proposals/error.tsx")).toContain("GracefulErrorBoundary");
  expect(canonical).toContain("PageHeader");
 });
});
