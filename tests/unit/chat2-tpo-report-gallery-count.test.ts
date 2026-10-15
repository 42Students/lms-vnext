import {describe,it,expect} from "vitest";
import {countVisibleTpoReportCards,TPO_REPORT_GALLERY_GROUPS,tpoReportGalleryGroupSchema,filterTpoReportGallery} from "../../src/modules/placements/tpo-report-gallery-filter-model";
describe("TPO report gallery result count",()=>{
 it("counts the visible filtered cards rather than all registered cards",()=>{
  const rows=[{heading:"Student outcomes",cards:[{title:"Joined",description:"outcomes"},{title:"Offers",description:"offer"}]},
    {heading:"Overview and performance",cards:[{title:"CTC",description:"compensation"}]}];
  expect(countVisibleTpoReportCards(filterTpoReportGallery(rows,"","Student outcomes"))).toBe(2);
  expect(countVisibleTpoReportCards(filterTpoReportGallery(rows,"unmatched","ALL"))).toBe(0);
 });
 it("exposes every valid category to the filter control",()=>{
  for(const option of TPO_REPORT_GALLERY_GROUPS)expect(tpoReportGalleryGroupSchema.parse(option)).toBe(option);
 });
});
