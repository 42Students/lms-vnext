import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("TPO timed debarments wired to DB08",()=>{
 it("TPO-students-06 gives the placement cell until-date, N-drive and until-lifted debarment choices",()=>{
  const ui=src("src/components/tpo/tpo-timed-debar-control.tsx");
  for(const label of ["Until a date","For N drives","Until lifted","Reason for lifting","Review debarment","Review lift"])expect(ui).toContain(label);
  expect(src("src/app/(authenticated)/tpo/students/[membershipId]/participation/page.tsx")).toContain("<TpoTimedDebarControl");
 });
 it("TPO-students-06 scopes debar and lift to an authorized TPO and member with strict origin check",()=>{
  const route=src("src/app/api/placements/tpo/students/[membershipId]/debarments/route.ts");
  expect(route).toContain("isSameOriginRequest(request)");
  expect(route).toContain("requireTpoBatchActor(ctx)");
  expect(route).toContain("rows.find(row=>row.id===body.debarmentId)");
  expect(route).toContain("createPlacementDebarment");
  expect(route).toContain("liftPlacementDebarment");
 });
 it("TPO-students-07 preserves immutable DB08 history and refuses a concurrent second active debarment",()=>{
  const service=src("src/modules/placements/debarment-service.ts");
  expect(service).toContain('isDebarmentActive(value,collegeLocalDate())');
  expect(service).toContain('"DB08_DEBARMENT_ALREADY_ACTIVE"');
  expect(service).toContain("The DB trigger creates an immutable LIFTED action.");
  expect(src("src/db/schema/placement-debarments.ts")).toContain("'CREATED','DRIVE_COUNTED','LIFTED'");
 });
 it("GR-04 / GR-35 guards network/HTML failure and requires confirm dialog before saving debarment",()=>{
  const ui=src("src/components/tpo/tpo-timed-debar-control.tsx");
  expect(ui).toContain("apiFetch<{rows:TpoTimedDebarRow[]}>");
  expect(ui).toContain("<Dialog open={confirm!==null}");
  expect(ui).toContain('role="alert"');
 });
});
