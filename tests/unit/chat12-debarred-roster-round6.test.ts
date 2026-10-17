import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
import {isDebarmentActive} from "@/modules/placements/batch-registration-policy";
const src=(p:string)=>readFileSync(new URL("../../src/"+p,import.meta.url),"utf8");
describe("Chat-12 debarred roster integration",()=>{
 it("TPO-students-06 uses actual timed/drive DB08 rows, not a tagged participation string",()=>{
  const s=src("modules/placements/tpo-students-service.ts");
  expect(s).toContain('placementTableExists("placement_debarments")');
  expect(s).toContain("placementDebarments.collegeId,college.id");
 });
 it("TPO-students-07 shows active debarment status and keeps lifted rows out",()=>{
  expect(isDebarmentActive({liftedAt:new Date("2099-01-01"),untilDate:null,untilDrives:5,drivesCounted:0},"2099-01-02")).toBe(false);
 });
 it("TPO-students-19 shows debarred count alongside journey attention",()=>{
  expect(src("app/(authenticated)/tpo/students/page.tsx")).toContain("Debarred · {data.debarredCount}");
 });
 it("TPO-students-20 supports a validated debarred filter",()=>{
  expect(src("modules/placements/tpo-students-service.ts")).toContain('debarred:z.enum(["YES","NO"])');
 });
 it("TPO-students-24 retains debarred selection in URLs",()=>{
  expect(src("app/(authenticated)/tpo/students/page.tsx")).toContain('params.set("debarred"');
 });
 it("TPO-students-31 flags actual debarment without inventing a prep score",()=>{
  expect(src("modules/placements/tpo-students-model.ts")).toContain("row.debarred===true");
 });
 it("TPO-students-32 never equates absence of the debarment table with false",()=>{
  expect(src("modules/placements/tpo-students-service.ts")).toContain("debarmentAvailable?debarredIds.has(row.membershipId):null");
 });
 it("TPO-students-43 surfaces debarred in needs-attention facts",()=>{
  expect(src("components/tpo/tpo-students-spreadsheet.tsx")).toContain('label:"Debarred"');
 });
 it("TPO-students-48 shows a scoped and announced debarred count",()=>{
  expect(src("app/(authenticated)/tpo/students/page.tsx")).toContain("data.debarredCount>0");
 });
});
