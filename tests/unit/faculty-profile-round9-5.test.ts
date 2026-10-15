import {it,expect} from "vitest";
import {facultyProfileRecordMatches} from "@/modules/people/faculty-profile-repeatable-actions";
it("matches authored section fields while ignoring private receipts",()=>{
 const row={id:"a",title:"Learning systems",description:"Distributed",certificateDocumentId:"top-secret"};
 expect(facultyProfileRecordMatches(row,["title","description"],"  SYSTEMS ")).toBe(true);
 expect(facultyProfileRecordMatches(row,["title"],"distributed")).toBe(false);
 expect(facultyProfileRecordMatches(row,["title","description"],"top-secret")).toBe(false);
 expect(facultyProfileRecordMatches(row,["title"],"")).toBe(true);
});
