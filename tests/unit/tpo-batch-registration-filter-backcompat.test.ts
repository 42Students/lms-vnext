import {expect,it} from "vitest";
import {filterBatchRegistrations,tpoBatchRegistrationFilters} from "@/modules/placements/tpo-batch-registration-filter-model";
it("retains the original three-field filter call contract while accepting new parsed fields",()=>{
 const rows=[{membershipId:"m1",name:"Alex",choice:"PLACEMENTS"},{membershipId:"m2",name:"Robin",choice:null}];
 const previous={q:"",choice:"UNRECORDED" as const,page:1};
 expect(filterBatchRegistrations(rows,previous).map(row=>row.membershipId)).toEqual(["m2"]);
 const expanded=tpoBatchRegistrationFilters.parse({...previous,source:"ALL",recency:"ALL",order:"NAME_ASC",pageSize:25});
 expect(filterBatchRegistrations(rows,expanded).map(row=>row.membershipId)).toEqual(["m2"]);
});
