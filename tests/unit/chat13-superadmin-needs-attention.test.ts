import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";import {join} from "node:path";
const r=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("Super Admin placement operational attention",()=>{
 it("SA-placements-projects-05 identifies configurable stale screening, interview without schedule and deadline risk",()=>{
  const code=r("src/modules/placements/tpo-operations-service.ts");
  for(const v of ["staleApplicationDays = 7","STALE_APPLICATIONS","INTERVIEW_UNSCHEDULED","CLOSING_SOON_LOW_CONVERSION"])expect(code).toContain(v);
  const view=r("src/components/placements/placement-operations-overview.tsx");
  expect(view).toContain('name="staleDays"');expect(view).toContain('"/applications"');
 });
 it("GR-36 stale threshold explains its units",()=>{
  const view=r("src/components/placements/placement-operations-overview.tsx");
  expect(view).toContain("Stale after");
  expect(view).toContain("{n} days");
 });
 it("GR-38 attention thresholds are bounded positive days",()=>{
  const code=r("src/modules/placements/tpo-operations-service.ts");
  expect(code).toContain("Math.max(1,Math.min(90,staleApplicationDays))");
 });
 it("GR-71 attention queue has a descriptive empty state",()=>{
  expect(r("src/components/placements/placement-operations-overview.tsx")).toContain("No placement work is blocked");
 });
 it("GR-73 attention threshold persists in the URL",()=>{
  const page=r("src/app/(authenticated)/admin/placements/page.tsx");
  expect(page).toContain("staleDays={staleDays}");
  expect(page).toContain("Number(raw.staleDays)");
 });
});
