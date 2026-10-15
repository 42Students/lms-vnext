import {expect,it} from "vitest";
import {tpoJourneyDrillFilters,tpoBranchDrillFilters} from "@/modules/placements/tpo-student-drill-filters-model";
it("retains unrelated roster filters while resetting pagination for summary drill-downs",()=>{
 const current={branchId:"b",search:"Alice",pageSize:50,columns:"name,status"};
 expect(tpoJourneyDrillFilters(current,"PLACED")).toEqual({...current,journeyState:"PLACED",page:1});
 expect(tpoBranchDrillFilters({journeyState:"APPLYING",search:"Alice",pageSize:25},"b"))
  .toEqual({journeyState:"APPLYING",search:"Alice",pageSize:25,branchId:"b",page:1});
});
