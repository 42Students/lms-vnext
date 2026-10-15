import {describe,it,expect} from "vitest";
import {filterTpoReportGallery,tpoReportGalleryGroupSchema} from "../../src/modules/placements/tpo-report-gallery-filter-model";
const groups=[
 {heading:"Overview and performance",cards:[{title:"CTC",description:"Compensation"}]},
 {heading:"Student outcomes",cards:[{title:"Unplaced",description:"Students"}]},
];
describe("TPO report gallery category",()=>{
 it("filters a selected category without removing the full source gallery",()=>{
  const result=filterTpoReportGallery(groups,"","Student outcomes");
  expect(result.map(g=>g.heading)).toEqual(["Student outcomes"]);
  expect(groups).toHaveLength(2);
 });
 it("composes category with textual search",()=>{
  expect(filterTpoReportGallery(groups,"CTC","Student outcomes")).toEqual([]);
  expect(filterTpoReportGallery(groups,"CTC","ALL")).toHaveLength(1);
 });
 it("denies unrecognized URL category",()=>{
  expect(tpoReportGalleryGroupSchema.safeParse("wrong").success).toBe(false);
 });
});
