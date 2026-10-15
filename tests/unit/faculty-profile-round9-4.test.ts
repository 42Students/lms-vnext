import {it,expect} from "vitest";
import {moveFacultyProfileDraftRow} from "@/modules/people/faculty-profile-repeatable-actions";
it("moves the exact row while retaining its ID and original rows",()=>{
 const rows=[{id:"a"},{id:"b"},{id:"c"}];
 expect(moveFacultyProfileDraftRow(rows,"c",0).map(x=>x.id)).toEqual(["c","a","b"]);
 expect(moveFacultyProfileDraftRow(rows,"a",2).map(x=>x.id)).toEqual(["b","c","a"]);
 expect(rows.map(x=>x.id)).toEqual(["a","b","c"]);
 expect(moveFacultyProfileDraftRow(rows,"missing",0)).toEqual(rows);
});
