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
  expect(code).toContain("if (!destination) {");
  expect(code).toContain("notFound();");
  expect(code).toContain("No template in this link");
  expect(code).toMatch(/query\["q"\]\.length\s*<=\s*100/);
  expect(code).toMatch(/return redirect\(destination\s*\+\s*\(search\.size\s*\?\s*"\?"\s*\+\s*search\.toString\(\)\s*:\s*""\)\);/);
  expect(code).toContain('new URLSearchParams()');
  expect(code).toContain('search.set("q", query["q"])');

  expect(code).not.toContain("window.location");
  const loading=source("src/app/(authenticated)/superadmin/[...legacy]/loading.tsx");
  const error=source("src/app/(authenticated)/superadmin/[...legacy]/error.tsx");
  expect(loading).toContain('role="status"');
  expect(loading).toContain('aria-live="polite"');
  expect(loading).toContain("Array.from({length:6}");
  expect(error).toContain("GracefulErrorBoundary");
  expect(error).toContain("reset={reset}");
 });
});
