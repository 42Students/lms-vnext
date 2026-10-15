import {it,expect} from "vitest";
import {facultyProfileSaveReceipt} from "@/modules/people/faculty-profile-save-response";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
it("requires every persisted top-level profile section before state replacement",()=>{
 expect(()=>facultyProfileSaveReceipt({document:{},version:1},0)).toThrow();
 const missingIdentity={...emptyFacultyProfileDocument};
 delete (missingIdentity as Partial<typeof missingIdentity>).identitySummary;
 expect(()=>facultyProfileSaveReceipt({document:missingIdentity,version:1},0)).toThrow();
 expect(facultyProfileSaveReceipt({document:emptyFacultyProfileDocument,version:1},0).document).toEqual(emptyFacultyProfileDocument);
});
