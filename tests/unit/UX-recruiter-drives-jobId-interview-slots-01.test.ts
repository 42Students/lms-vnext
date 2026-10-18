import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("UX-recruiter-drives-jobId-interview-slots-01",()=>{
 it("preserves role-safe navigation, exact route copy and accessible shared surface",()=>{
  const source=read("src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/page.tsx");
  expect(source).toContain("@/app/(authenticated)/hr/drives/[jobId]/interview-slots/page");
  expect(source).toMatch(/export\s*\{\s*default\s*\}/);
  const canonical=read("src/app/(authenticated)/hr/drives/[jobId]/interview-slots/page.tsx");
  expect(canonical).toMatch(/export\s+default|export\s*\{\s*default/);
  expect(read("src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/loading.tsx")).toContain("GracefulPageLoading");
  expect(read("src/app/(authenticated)/recruiter/drives/[jobId]/interview-slots/error.tsx")).toContain("GracefulErrorBoundary");
  expect(canonical).toContain("PageHeader");
 });
});
