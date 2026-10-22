import {it,expect} from "vitest";
import {facultyProfileSaveFailure} from "@/modules/people/faculty-profile-error-model";
it("explains uncoded 409 as a stale profile, not a malformed edit",()=>{
 expect(facultyProfileSaveFailure(undefined,409)).toMatch(/updated elsewhere/);
 expect(facultyProfileSaveFailure(undefined,409)).toMatch(/refresh and try again/);
});
