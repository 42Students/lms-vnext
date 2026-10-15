import {it,expect} from "vitest";
import {filterBatchRegistrations,paginateBatchRegistrations,tpoBatchRegistrationFilters} from "@/modules/placements/tpo-batch-registration-filter-model";
it("filters before paging without calling unrecorded learners registered",()=>{
 const rows=[{membershipId:"a",name:"Ana",choice:"PLACEMENTS"},
  {membershipId:"b",name:"Bala",choice:null},{membershipId:"c",name:"Cara",choice:"HIGHER_STUDIES"}];
 const filtered=filterBatchRegistrations(rows,{q:"",choice:"UNRECORDED",page:1});
 expect(filtered.map(x=>x.membershipId)).toEqual(["b"]);
 expect(paginateBatchRegistrations(filtered,1,1).total).toBe(1);
 expect(tpoBatchRegistrationFilters.safeParse({choice:"BOGUS"}).success).toBe(false);
});
