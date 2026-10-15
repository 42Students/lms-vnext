import {expect,it} from "vitest";
import {globalTpoRequestFirstPageHref} from "@/modules/placements/tpo-global-requests-model";
it("retains request kind, age, sort and search while returning to first page",()=>{
 const href=globalTpoRequestFirstPageHref({status:"PENDING",age:"OLDER_THAN_7_DAYS",
 sort:"OLDEST_FIRST",requestType:"OFFER_EXTENSION",search:"A&B",pageSize:50});
 expect(href).toContain("page=1");
 expect(href).toContain("age=OLDER_THAN_7_DAYS");
 expect(href).toContain("requestType=OFFER_EXTENSION");
 expect(href).toContain("search=A%26B");
 expect(href).toContain("pageSize=50");
});
