import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {parseTpoGridColumns,updateTpoGridQuery} from "@/modules/placements/tpo-grid-model";
const root=process.cwd();
const read=(path:string)=>readFileSync(join(root,path),"utf8");
describe("TPO spreadsheet mounted on authorized Students and Applications",()=>{
 it("mounts real reusable grid and URL filter panel on both canonical TPO pages",()=>{
  for(const pair of [
   ["src/app/(authenticated)/tpo/students/page.tsx","TpoStudentsSpreadsheet"],
   ["src/app/(authenticated)/tpo/placements/jobs/[jobId]/applicants-pipeline/page.tsx","TpoApplicationsSpreadsheet"],
  ] as const){
   expect(read(pair[0])).toContain("<"+pair[1]);
  }
  for(const path of ["src/components/tpo/tpo-students-spreadsheet.tsx","src/components/tpo/tpo-applications-spreadsheet.tsx"]){
   expect(read(path)).toContain("<TpoGrid integratedWorkspace");
   expect(read(path)).toContain("<GridWorkspace");
   expect(read(path)).toContain("filters={filters}");
  }
  const workspace=read("src/components/tpo/grid/grid-workspace.tsx");
  expect(workspace).toContain("<TpoGridFilterPanel fields={filters} title={filterTitle}");
  for(const path of ["src/components/tpo/tpo-students-spreadsheet.tsx","src/components/tpo/tpo-applications-spreadsheet.tsx"]){
   expect(read(path)).toContain("integratedWorkspace");
  }
 });
 it("never selects export-only or forged columns",()=>{
  const allowed=["name","stage"];
  expect(parseTpoGridColumns("name,private,stage,name",allowed)).toEqual(["name","stage"]);
  const params=updateTpoGridQuery(new URLSearchParams("page=5&stage=PENDING&columns=name"),{columns:"stage"});
  expect(params.get("stage")).toBe("PENDING");
  expect(params.has("page")).toBe(false);
 });
});
