import {it,expect} from "vitest";
import {facultyProfileTextDraftIssue} from "@/modules/people/faculty-profile-draft-actions";
it("names the invalid field so Faculty can correct it",()=>{
 expect(facultyProfileTextDraftIssue("personalDetails",{dateOfBirth:"2025-02-31"})).toMatch(/^dateOfBirth:/);
 expect(facultyProfileTextDraftIssue("address",{currentAddress:"Hi"})).toBeNull();
 expect(facultyProfileTextDraftIssue("about",{description:"x".repeat(5001)})).toMatch(/^description:/);
});
