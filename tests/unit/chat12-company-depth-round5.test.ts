import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("student best-so-far evidence",()=>{
 it("TPO-students-28 shows only company of deepest applied round, never a guess for a placed or issued offer",()=>{
  const m=src("src/modules/placements/tpo-students-model.ts");
  expect(m).toContain("application.id===latestDepth.applicationId");
  expect(m).toContain("latestDepth&&!placed&&offerCount===0");
  expect(src("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("row.bestCompany");
 });
});
