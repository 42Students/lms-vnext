import {it,expect} from "vitest";
import {facultyProfileSaveFailure} from "@/modules/people/faculty-profile-error-model";
it("explains 429 rate limits without encouraging rapid resubmission",()=>{
 expect(facultyProfileSaveFailure(undefined,429)).toMatch(/try again later/);
 expect(facultyProfileSaveFailure(undefined,429)).toMatch(/Avoid repeated/);
});
