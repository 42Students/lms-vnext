import {expect,it} from "vitest";
import {tpoBatchRegistrationFilters,paginateBatchRegistrations} from "@/modules/placements/tpo-batch-registration-filter-model";
it("preserves 25-row default and allows only bounded 50/100 selections",()=>{
 expect(tpoBatchRegistrationFilters.parse({}).pageSize).toBe(25);
 expect(tpoBatchRegistrationFilters.parse({pageSize:"50"}).pageSize).toBe(50);
 expect(tpoBatchRegistrationFilters.safeParse({pageSize:1000}).success).toBe(false);
 expect(paginateBatchRegistrations([1,2,3,4],2,2).items).toEqual([3,4]);
});
