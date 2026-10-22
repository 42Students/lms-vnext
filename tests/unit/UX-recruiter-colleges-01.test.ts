import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");

describe("UX-recruiter-colleges-01",()=>{
 it("preserves role-safe navigation, exact route copy and accessible shared surface",()=>{
  const source=read("src/app/(authenticated)/recruiter/colleges/page.tsx");
  expect(source).toContain("redirect(\"/recruiter/home\")");
  expect(source).not.toContain("window.open");
  expect(read("src/app/(authenticated)/recruiter/colleges/loading.tsx")).toContain("GracefulPageLoading");
  expect(read("src/app/(authenticated)/recruiter/colleges/error.tsx")).toContain("GracefulErrorBoundary");
  expect(read("src/app/(authenticated)/hr/home/page.tsx")).toContain("PageHeader");
 });
});
