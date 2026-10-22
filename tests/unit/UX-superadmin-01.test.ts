import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("UX-superadmin-01",()=>{
 it("preserves original wording, permissions and supported accessible UX",()=>{
  const code=source("src/app/(authenticated)/superadmin/page.tsx");
  expect(code).toContain("redirect(\"/superadmin/dashboard\")");


  const loading=source("src/app/(authenticated)/superadmin/loading.tsx");
  const error=source("src/app/(authenticated)/superadmin/error.tsx");
  expect(loading).toContain("GracefulPageLoading");
  expect(error).toContain("GracefulErrorBoundary");
  expect(error).toContain("reset={reset}");
 });
});
