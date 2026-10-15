import {expect,it} from "vitest";
import {tpoStudentRequestShortcutFilters} from "@/modules/placements/tpo-student-request-shortcut-model";
it("keeps search and page size but resets page on request status drill-down",()=>{
 expect(tpoStudentRequestShortcutFilters("Alice",50,"REJECTED")).toEqual({
  status:"REJECTED",search:"Alice",pageSize:50,page:1,
 });
});
