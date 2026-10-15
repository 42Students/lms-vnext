import {it,expect} from "vitest";
import {facultyProfileSaveReceipt} from "@/modules/people/faculty-profile-save-response";
import {emptyFacultyProfileDocument} from "@/modules/people/faculty-profile-document";
it("refuses missing nested protected identity and contact fields",()=>{
 const missingIdentity={...emptyFacultyProfileDocument,identitySummary:{aadhaarLast4:""}};
 expect(()=>facultyProfileSaveReceipt({document:missingIdentity,version:2},1)).toThrow();
 const missingPhone={...emptyFacultyProfileDocument,contact:{contactMobile:""}};
 expect(()=>facultyProfileSaveReceipt({document:missingPhone,version:2},1)).toThrow();
 expect(facultyProfileSaveReceipt({document:emptyFacultyProfileDocument,version:2},1).version).toBe(2);
});
