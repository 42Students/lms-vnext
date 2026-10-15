import {expect,it} from "vitest";
import {tpoVisibleCompanyReportCsv,tpoCompanyPageCsvHref} from "@/modules/placements/tpo-company-page-csv-model";
it("preserves visible filter scope and neutralizes company-name formulas in CSV",()=>{
 const href=tpoCompanyPageCsvHref({seasonId:"s",jobId:"j",q:"A&B",sort:"NAME",page:2});
 expect(href).toContain("q=A%26B");expect(href).toContain("page=2");
 const csv=tpoVisibleCompanyReportCsv([{companyName:"=SUM(1)",companyId:"id",
  drives:1,applicants:2,applications:2,offers:1,acceptedOffers:1,placed:1,
  averagePackageInr:null,highestPackageInr:null}]);
 expect(csv).toContain("'=SUM(1)");
 expect(csv).not.toContain("companyId");
});
