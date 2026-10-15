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

it("keeps recorded choices, unrecorded, and All mutually distinct",()=>{
 const rows=[{membershipId:"a",name:"Ana",choice:null},
  {membershipId:"b",name:"Bea",choice:"PLACEMENTS"}];
 expect(filterBatchRegistrations(rows,{q:"",choice:"ALL",page:1})).toHaveLength(2);
 expect(filterBatchRegistrations(rows,{q:"",choice:"PLACEMENTS",page:1}).map(row=>row.name)).toEqual(["Bea"]);
 expect(filterBatchRegistrations(rows,{q:"",choice:"UNRECORDED",page:1}).map(row=>row.name)).toEqual(["Ana"]);
});
