import {it,expect} from "vitest";
import {facultyProfileSkillsIssue} from "@/modules/people/faculty-profile-draft-actions";
const id="317458a6-9f8b-4f48-862b-91a270e12bb1";
it("rejects invalid and duplicate-id skills but accepts valid saved records",()=>{
 const row={id,skill:"Java",proficiency:"Advanced"};
 expect(facultyProfileSkillsIssue([row])).toBeNull();
 // Untitled legacy rows may remain saved so faculty can repair them without data loss.
 expect(facultyProfileSkillsIssue([{...row,skill:""}])).toBeNull();
 expect(facultyProfileSkillsIssue([{...row,skill:"x".repeat(121)}])).not.toBeNull();
 expect(facultyProfileSkillsIssue([row,row])).toMatch(/Duplicate/);
});
