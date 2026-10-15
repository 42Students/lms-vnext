import {it,expect} from "vitest";
import {facultyProfileTextDraftIssue} from "@/modules/people/faculty-profile-draft-actions";
it("validates required date, social URL and section shape before save",()=>{
 expect(facultyProfileTextDraftIssue("about",{description:"Teaching"})).toBeNull();
 expect(facultyProfileTextDraftIssue("personalDetails",{gender:"",dateOfBirth:"2026-02-30",bloodGroup:""})).not.toBeNull();
 expect(facultyProfileTextDraftIssue("socialProfiles",{linkedIn:"javascript:alert(1)"})).not.toBeNull();
 expect(facultyProfileTextDraftIssue("skills",{skill:"Java"})).not.toBeNull();
});
