import {expect,it} from "vitest";
import {tpoFilteredSharePreviewExportHref} from "@/modules/placements/tpo-share-preview-export-href";
it("preserves the active name filter on capped TPO shortlist export",()=>{
 expect(tpoFilteredSharePreviewExportHref("id","")).toContain("/share-preview/export");
 expect(tpoFilteredSharePreviewExportHref("id","A&B")).toContain("?q=A%26B");
});
