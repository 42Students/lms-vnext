import {it,expect} from "vitest";
import {facultyProfilePublicLinkIssue,facultyProfileTextDraftIssue} from "@/modules/people/faculty-profile-draft-actions";
it("permits HTTPS and unchanged legacy links but rejects unsafe changed links",()=>{
 const old={portfolio:"http://legacy.example.edu"};
 expect(facultyProfilePublicLinkIssue(old,old)).toBeNull();
 expect(facultyProfilePublicLinkIssue(old,{portfolio:"https://example.edu/works"})).toBeNull();
 expect(facultyProfilePublicLinkIssue(old,{portfolio:"http://example.edu"})).toMatch(/HTTPS/);
 expect(facultyProfilePublicLinkIssue(old,{portfolio:"https://user:secret@example.edu"})).toMatch(/HTTPS/);
 expect(facultyProfilePublicLinkIssue(old,{portfolio:"https://localhost/test"})).toMatch(/localhost/);
 expect(facultyProfileTextDraftIssue("socialProfiles",{portfolio:"https://example.edu"},old)).toBeNull();
});
