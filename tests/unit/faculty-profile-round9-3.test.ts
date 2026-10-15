import {it,expect} from "vitest";
import {duplicateFacultyProfileDraftRow} from "@/modules/people/faculty-profile-repeatable-actions";
it("duplicates an entry with a new id and clears all private receipt IDs",()=>{
 const x={id:"old",institutionName:"College",certificateDocumentId:"receipt"};
 const out=duplicateFacultyProfileDraftRow([x],"old",30,"new");
 expect(out).toHaveLength(2);expect(out[1]).toEqual({id:"new",institutionName:"College",certificateDocumentId:null});
 expect(x.certificateDocumentId).toBe("receipt");
});
it("respects the cap and ID uniqueness",()=>{
 const a={id:"a"};expect(duplicateFacultyProfileDraftRow([a],"a",1,"b")).toEqual([a]);
 expect(duplicateFacultyProfileDraftRow([a],"a",30,"a")).toEqual([a]);
});
