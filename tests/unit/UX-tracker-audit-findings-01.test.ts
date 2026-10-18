import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("UX-tracker-audit-findings-01",()=>{
 it("preserves canonical route, scoped data and the audited mobile/action states",()=>{
  const source=read("src/app/(authenticated)/tracker/audit-findings/page.tsx");
  expect(source).toContain("<DataTable columns={findingColumns}");
  expect(source).toContain("caption=\"Independent audit findings\"");
  expect(source).toContain("mobilePriority:\"primary\"");
  expect(source).toContain("mobilePriority:\"secondary\"");
  expect(source).toContain("const refusedColumns");
  expect(source).toContain("<DataTable columns={refusedColumns}");
  expect(source).toContain("Review importer logs for the remaining details.");
  expect(source).toContain("empty={<p role=\"status\"");
  expect(source).toContain("No independent audit findings match these filters.");
  expect(source).toContain("independentFindingHref");
  expect(source).toContain("requirePermission(ctx,\"admin-scope.select\")");
  expect(source).toContain("focus-visible:outline-2");
 });
});
