import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {tpoBatchReturnHref} from "@/modules/placements/tpo-batch-return-model";
import {tpoBatchDecisionSchema} from "@/modules/placements/tpo-batch-decision-model";

const source=(path:string)=>readFileSync(path,"utf8");
const list="src/app/(authenticated)/tpo/batches/page.tsx";
const detail="src/app/(authenticated)/tpo/batches/[batchId]/page.tsx";
const students="src/app/(authenticated)/tpo/batches/[batchId]/students/page.tsx";
describe("TPO batch navigation and eligibility parity",()=>{
 it("TPO-batches-12 debounces URL-synced search and clears its query",()=>{
  const search=source("src/components/tpo/tpo-batch-instant-search.tsx");
  expect(search).toContain("setTimeout(");
  expect(search).toContain('params.set("q",search)');
  expect(search).toContain('params.delete("q")');
  expect(search).toContain('params.delete("page")');
  expect(search).toContain("router.replace(");
  expect(search).toContain('aria-label="Clear batch search"');
  expect(source(list)).toContain("<TpoBatchInstantSearch");
 });
 it("TPO-batches-16 preserves filters on back without an unsafe redirect",()=>{
  const url="/tpo/batches?q=2027&sort=NAME_DESC&state=IN_PLACEMENTS&page=3";
  expect(tpoBatchReturnHref(url)).toBe(url);
  for(const invalid of ["https://host.test/tpo/batches","//host.test/tpo/batches","/tpo/batches/other","/tpo/batches?admin=true",["/tpo/batches"],""])expect(tpoBatchReturnHref(invalid)).toBe("/tpo/batches");
  expect(source(list)).toContain('"?returnTo="+encodeURIComponent(tpoBatchPageHref(');
  expect(source(detail)).toContain("href={backHref}");
 });
 it("TPO-batches-51 removes misplaced academic import without hiding eligibility import",()=>{
  const content=source(students);
  expect(content).not.toContain("TpoAcademicImportPreview");
  expect(content).toContain("<TpoBatchEligibilityImport");
  expect(content).toContain("Download blank eligibility import CSV");
 });
 it("TPO-batches-57 enforces the same strict reason limits in UI and schema",()=>{
  const base={membershipId:"11111111-1111-4111-8111-111111111111",expectedVersion:"v1",decision:"INELIGIBLE"};
  expect(tpoBatchDecisionSchema.safeParse({...base,reason:"No"}).success).toBe(false);
  expect(tpoBatchDecisionSchema.safeParse({...base,reason:"Not interested"}).success).toBe(true);
  expect(tpoBatchDecisionSchema.safeParse({...base,reason:"x".repeat(201)}).success).toBe(false);
  expect(source("src/components/tpo/tpo-batch-decision-control.tsx")).toContain("maxLength={200}");
 });
});
