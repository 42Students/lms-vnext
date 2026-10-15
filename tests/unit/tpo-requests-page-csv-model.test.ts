import {expect,it} from "vitest";
import {toTpoRequestsPageCsv,tpoRequestsExportHref} from "@/modules/placements/tpo-requests-page-csv-model";
it("exports only explicitly supplied page rows with spreadsheet-safe fields",()=>{
 const csv=toTpoRequestsPageCsv([{id:"uuid",studentName:"=SUM(1+1)",requestType:"OFFER_EXTENSION",status:"PENDING",jobTitle:"@bad",companyName:'A "B"',requestedAt:new Date("2026-10-15T00:00:00Z")}]);
 expect(csv).toContain('"\'=SUM(1+1)"');
 expect(csv).toContain('"\'@bad"');
 expect(csv).toContain('"A ""B"""');
 expect(csv).not.toContain("Reason");
 expect(csv).toContain("2026-10-15T00:00:00.000Z");
});
it("preserves selected filters and page bounds",()=>{
 expect(tpoRequestsExportHref({status:"PENDING",requestType:"ALL",age:"ALL",sort:"NEWEST_FIRST",search:"A B",page:2,pageSize:25})).toContain("search=A+B&page=2&pageSize=25");
});
