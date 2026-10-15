import {it,expect} from "vitest";
import {facultyProfileSaveReceipt} from "@/modules/people/faculty-profile-save-response";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
it("accepts a complete versioned document and rejects malformed envelopes",()=>{
 const valid={document:emptyFacultyProfileDocument,version:2};
 expect(facultyProfileSaveReceipt(valid,1).version).toBe(2);
 for(const raw of [null,[],{version:2},{document:null,version:2},{document:[],version:2}]){
  expect(()=>facultyProfileSaveReceipt(raw,1)).toThrow("PROFILE_SAVE_RESPONSE_INVALID");
 }
});
