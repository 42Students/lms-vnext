import {expect,it} from "vitest";
import {filterTpoJobTypes,tpoJobTypesEmptyMessage} from "@/modules/placements/tpo-job-type-filter-model";
it("filters active and retired custom job types without mutating history",()=>{
 const rows=[{label:"Internship",active:true},{label:"Graduate trainee",active:false}];
 expect(filterTpoJobTypes(rows,"train","INACTIVE")).toEqual([rows[1]]);
 expect(filterTpoJobTypes(rows,"intern","INACTIVE")).toEqual([]);
 expect(filterTpoJobTypes(rows,"","ALL")).toHaveLength(2);
 expect(tpoJobTypesEmptyMessage(0,"","ALL")).toContain("Add one");
 expect(rows[1].active).toBe(false);
});
