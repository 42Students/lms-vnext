import {expect,it} from "vitest";
import {publicApplicantExportHref} from "@/modules/placements/company-share/export-href-model";
it("carries applied name filter to capped audited CSV",()=>{
 expect(publicApplicantExportHref("opaque","A&B")).toContain("q=A%26B");
 expect(publicApplicantExportHref("opaque","")).toBe("/api/placements/company-share/opaque/export");
});
