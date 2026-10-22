import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("UX-tracker-audit-findings-01",()=>{
 it("preserves canonical route, scoped data and the audited mobile/action states",()=>{
  const source=read("src/app/(authenticated)/tracker/audit-findings/page.tsx");
  const board=read("src/components/tracker/independent-audit-findings-board.tsx");
  expect(source).toContain("<IndependentAuditFindingsBoard rows={data.items}");
  expect(board).toContain("<DataTable columns={columns}");
  expect(board).toContain("caption=\"Independent audit findings\"");
  expect(board).toContain("mobilePriority:\"primary\"");
  expect(board).toContain("mobilePriority:\"secondary\"");
  expect(source).toContain("const refusedColumns");
  expect(source).toContain("<DataTable columns={refusedColumns}");
  expect(source).toContain("Review importer logs for the remaining details.");
  expect(board).toContain("empty={<EmptyState");
  expect(board).toContain("No findings match");
  expect(source).toContain("independentFindingHref");
  expect(source).toContain("requirePermission(ctx,\"admin-scope.select\")");
  expect(source).toContain("focus-visible:outline-2");
 });
});
