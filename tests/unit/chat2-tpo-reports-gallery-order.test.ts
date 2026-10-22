import {describe,it,expect} from "vitest";
import {alphabetizeTpoReportGallery} from "../../src/modules/placements/tpo-report-gallery-filter-model";
describe("TPO report gallery display order",()=>{
 it("preserves the legacy owner-authored order within existing category groups",()=>{
  const groups=[{heading:"One",cards:[{title:"Zebra",path:"/z"},{title:"Alpha",path:"/a"}]},
                {heading:"Two",cards:[{title:"Beta",path:"/b"}]}];
  const sorted=alphabetizeTpoReportGallery(groups);
  expect(sorted.map(g=>g.heading)).toEqual(["One","Two"]);
  expect(sorted[0]?.cards.map(x=>x.title)).toEqual(["Zebra","Alpha"]);
  expect(groups[0]?.cards[0]?.title).toBe("Zebra");
 });
});
