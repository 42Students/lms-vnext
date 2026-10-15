import {it,expect} from "vitest";
import {removeFacultyProfileDraftRow} from "@/modules/people/faculty-profile-repeatable-actions";
it("removes only the exact draft row and keeps managed certificate holders",()=>{
 const rows=[{id:"a",certificateDocumentId:null},{id:"b",certificateDocumentId:"private-receipt"}];
 expect(removeFacultyProfileDraftRow(rows,"a")).toEqual([rows[1]]);
 expect(removeFacultyProfileDraftRow(rows,"b")).toEqual(rows);
 expect(removeFacultyProfileDraftRow(rows,"not-here")).toEqual(rows);
});
