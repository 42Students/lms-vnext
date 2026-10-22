import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("UX-superadmin-legacy-01",()=>{
 it("preserves original wording, permissions and supported accessible UX",()=>{
  const code=source("src/app/(authenticated)/superadmin/[...legacy]/page.tsx");
  expect(code).toContain("isSuperAdmin(context)");
  expect(code).toContain("redirect(\"/dashboard\")");
  expect(code).toContain("legacySuperAdminDestination(legacy, type)");
  expect(code).toContain("if(!destination)notFound();");
  expect(code).toContain("query.q.length<=100");
  expect(code).toContain("return redirect(destination+");

  expect(code).not.toContain("window.location");
  const loading=source("src/app/(authenticated)/superadmin/[...legacy]/loading.tsx");
  const error=source("src/app/(authenticated)/superadmin/[...legacy]/error.tsx");
  expect(loading).toContain("GracefulPageLoading");
  expect(error).toContain("GracefulErrorBoundary");
  expect(error).toContain("reset={reset}");
 });
});
