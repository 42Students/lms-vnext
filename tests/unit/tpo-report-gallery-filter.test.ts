import {expect,it} from "vitest";
import {tpoReportGallerySearchSchema,filterTpoReportGallery} from "@/modules/placements/tpo-report-gallery-filter-model";
it("matches report title, description or category without inventing unavailable links",()=>{
 const groups=[{heading:"Performance",cards:[{title:"CTC",description:"Compensation"},{title:"Offers",description:"Current offers"}]}];
 expect(filterTpoReportGallery(groups,"compensation")[0].cards.map(x=>x.title)).toEqual(["CTC"]);
 expect(filterTpoReportGallery(groups,"unknown")).toEqual([]);
 expect(tpoReportGallerySearchSchema.safeParse("x".repeat(81)).success).toBe(false);
});
