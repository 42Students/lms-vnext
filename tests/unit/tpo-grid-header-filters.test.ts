import {it,expect} from "vitest";
import {filterTpoGridRows} from "@/modules/placements/tpo-grid-model";
it("filters only shown columns without leaking export-only attributes",()=>{
 const cols=[
  {key:"name",label:"Name",read:(r:{name:string;private:string})=>r.name},
  {key:"private",label:"Private",exportOnly:true,read:(r:{name:string;private:string})=>r.private},
 ];
 const rows=[{name:"Alice",private:"SENSITIVE"},{name:"Bob",private:"public"}];
 expect(filterTpoGridRows(rows,cols,{name:"AL"})).toHaveLength(1);
 expect(filterTpoGridRows(rows,cols,{private:"SENSITIVE"})).toHaveLength(2);
});
