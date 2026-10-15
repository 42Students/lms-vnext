import {describe,expect,it} from "vitest";
import {superAdminFeaturePageCsv} from "@/modules/module-access/admin-feature-export";
import {adminFeatureExportHref} from "@/modules/module-access/admin-read-model";
describe("Super Admin feature matrix CSV",()=>{
 it("exports only authorized, bounded, formula-safe college and module state",()=>{
  const rows=Array.from({length:25},(_,index)=>({
   name:index===0?"=DANGEROUS":"College "+index,code:index===0?"+SUM(1)":"C"+index,
   modules:[{module:"projects" as const,label:"Projects",enabled:false,source:"PERSISTED" as const,level:"COLLEGE",locked:true}],
  }));
  const csv=superAdminFeaturePageCsv(rows);
  expect(csv).toContain("'=DANGEROUS");
  expect(csv).toContain("'+SUM(1)");
  expect(csv).toContain('"Off","COLLEGE","Yes"');
  expect(csv).not.toContain("College 24");
  expect(csv.split("\r\n").filter(Boolean)).toHaveLength(21);
 });
 it("preserves the filter and page in the read-only export link",()=>{
  const href=adminFeatureExportHref({q:"engineering",page:2,module:"projects",locks:"LOCKED"});
  expect(href).toContain("/api/admin/features/export?");
  expect(href).toContain("module=projects");
  expect(href).toContain("locks=LOCKED");
 });
});
