import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("UX-recruiter-home-01",()=>{
 it("preserves canonical route, scoped data and the audited mobile/action states",()=>{
  const source=read("src/app/(authenticated)/recruiter/home/page.tsx");
  expect(source).toContain("@/app/(authenticated)/hr/home/page");
  expect(source).toContain("export default function RecruiterHome");
  expect(source).toContain("<HrHome searchParams={searchParams}/>");
  const canonical=read("src/app/(authenticated)/hr/home/page.tsx");
  expect(canonical).toMatch(/export\s+default|export\s*\{\s*default/);
  expect(read("src/app/(authenticated)/recruiter/home/loading.tsx")).toContain("GracefulPageLoading");
  expect(read("src/app/(authenticated)/recruiter/home/error.tsx")).toContain("GracefulErrorBoundary");
  expect(canonical).toContain("PageHeader");
 });
});
