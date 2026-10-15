import {it,expect} from "vitest";
import {facultyProfileSaveReceipt} from "@/modules/people/faculty-profile-save-response";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
it("rejects stale, skipped and non-integer optimistic receipts",()=>{
 for(const version of [4,6,0,4.5,Number.MAX_SAFE_INTEGER]){
  expect(()=>facultyProfileSaveReceipt({document:emptyFacultyProfileDocument,version},4)).toThrow();
 }
 expect(facultyProfileSaveReceipt({document:emptyFacultyProfileDocument,version:5},4).version).toBe(5);
});
