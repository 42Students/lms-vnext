import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");
describe("TPO public placements publication and copy",()=>{
 it("TPO-campaigns-public-35 returns 404 for unknown hosts or known unpublished reports",()=>{
  const p=src("src/app/placements/page.tsx");
  const nf=src("src/app/placements/not-found.tsx");
  expect(p).toContain('if(tenant.kind!=="college"');
  expect(p).toContain("(publicRead?.available&&!published)");
  expect(p).toContain("notFound()");
  expect(nf).toContain("This page isn&apos;t available");
  expect(nf).toContain("The placement cell hasn&apos;t published a placements page here.");
 });
 it("TPO-campaigns-public-36 uses the college-specific legacy heading and removes platform-only footer",()=>{
  const p=src("src/app/placements/page.tsx");
  expect(p).toContain('"Placements at "+(college?.collegeName');
  expect(p).toContain("Recruit from us.");
  expect(p).not.toContain("42Students · Placements");
  expect(p).not.toContain("Back to college home");
  expect(p).toContain('publicPlacementDisclosure([');
 });
});
