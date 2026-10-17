import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {filterTpoBatchFacets,parseTpoBatchFacetQuery,tpoBatchFacetQueryPairs} from "@/modules/placements/tpo-batch-facets-model";
import {tpoBatchPageHref} from "@/modules/placements/tpo-batch-directory-pagination-model";
const src=(file:string)=>readFileSync(join(process.cwd(),file),"utf8");
const rows=[
 {program:"BTech",department:"CSE",endYear:2099,placementState:"In placements" as const},
 {program:"BTech",department:"ECE",endYear:2100,placementState:"Not started" as const},
 {program:"MTech",department:"CSE",endYear:2100,placementState:"Finished" as const},
];
describe("TPO-batches-11 multi-choice batch directory filters",()=>{
 it("TPO-batches-11 allows independent multiple State Department Program and Final year choices",()=>{
  const input=parseTpoBatchFacetQuery({facetState:["In placements","Finished"],
   facetDepartment:["CSE"],facetProgram:["BTech","MTech"],facetFinalYear:["2099","2100"]},rows);
  expect(input.success).toBe(true);
  if(!input.success)return;
  expect(filterTpoBatchFacets(rows,input.data)).toHaveLength(2);
  expect(tpoBatchFacetQueryPairs(input.data)).toHaveLength(7);
  expect(filterTpoBatchFacets(rows,{...input.data,states:["Finished"]})).toHaveLength(1);
 });
 it("TPO-batches-11 rejects forged non-roster facets, malformed or overlength values",()=>{
  expect(parseTpoBatchFacetQuery({facetProgram:["Unknown"]},rows).success).toBe(false);
  expect(parseTpoBatchFacetQuery({facetFinalYear:["1800"]},rows).success).toBe(false);
  expect(parseTpoBatchFacetQuery({facetState:["INVALID"]},rows).success).toBe(false);
  expect(parseTpoBatchFacetQuery({facetDepartment:Array.from({length:51},()=>"CSE")},rows).success).toBe(false);
 });
 it("TPO-batches-11 preserves repeated checkbox choices across batch pagination",()=>{
  const href=tpoBatchPageHref({facetState:["In placements","Finished"],facetFinalYear:["2099","2100"]},2,24);
  const url=new URL(href,"https://example.edu");
  expect(url.searchParams.getAll("facetState")).toEqual(["In placements","Finished"]);
  expect(url.searchParams.getAll("facetFinalYear")).toEqual(["2099","2100"]);
  expect(url.searchParams.get("page")).toBe("2");
 });
 it("TPO-batches-11 places live facet counts, chips, Reset, Clear all and Show N on actual batch list",()=>{
  const ui=src("src/components/tpo/tpo-batch-facet-filters.tsx");
  const page=src("src/app/(authenticated)/tpo/batches/page.tsx");
  for(const word of ["Filters · State, Department, Program, Final year","matching batches",
   "Remove ","Reset","Clear all","Show {count}","facetFinalYear","facetState","facetDepartment","facetProgram"])
   expect(ui).toContain(word);
  expect(page).toContain("<TpoBatchFacetFilters");
  expect(page).toContain("filterTpoBatchFacets(facetRows,selectedFacets)");
 });
});
