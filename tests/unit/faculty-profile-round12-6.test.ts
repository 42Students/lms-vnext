import {it,expect} from "vitest";
import {facultyProfileSaveFailure} from "@/modules/people/faculty-profile-error-model";
it("gives a sign-in recovery path for authentication failures",()=>{
 expect(facultyProfileSaveFailure(undefined,401)).toMatch(/Sign in again/);
 expect(facultyProfileSaveFailure(undefined,403)).toMatch(/permission/);
});
