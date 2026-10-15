import {expect,it} from "vitest";
import {parseGlobalTpoRequestFilters} from "@/modules/placements/tpo-global-requests-model";
it("rejects invalid status, age and pagination before the requests database read",()=>{
 expect(parseGlobalTpoRequestFilters({status:"FORGED"}).success).toBe(false);
 expect(parseGlobalTpoRequestFilters({age:"FOREVER"}).success).toBe(false);
 expect(parseGlobalTpoRequestFilters({page:0}).success).toBe(false);
 expect(parseGlobalTpoRequestFilters({status:"PENDING",page:1}).success).toBe(true);
});
