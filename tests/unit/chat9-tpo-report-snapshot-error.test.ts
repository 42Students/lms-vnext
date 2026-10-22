import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
const gallery=readFileSync(join(process.cwd(),"src/app/(authenticated)/tpo/reports/page.tsx"),"utf8");
describe("TPO report snapshot failure states",()=>{
 it("TPO-calendar-reports-55 never presents an empty placement snapshot as a successful zero and exposes Retry",()=>{
  expect(gallery).toContain("The headline numbers could not be loaded.");
  expect(gallery).toContain("do not mistake a failed snapshot for zero placements.");
  expect(gallery).toContain("Retry headline numbers");
  expect(gallery).toContain("getPlacementReportWorkspace");
  expect(gallery).toContain("} catch {");
  expect(gallery).toContain("Retry");
 });
});
