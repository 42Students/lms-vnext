import {it,expect} from "vitest";
import {facultyProfileSkillMatches} from "@/modules/people/faculty-profile-draft-actions";
it("filters skill or proficiency independently of the persisted collection",()=>{
 const entry={skill:"TypeScript",proficiency:"Expert"};
 expect(facultyProfileSkillMatches(entry,"TYPE")).toBe(true);
 expect(facultyProfileSkillMatches(entry,"expert")).toBe(true);
 expect(facultyProfileSkillMatches(entry,"Python")).toBe(false);
 expect(facultyProfileSkillMatches(entry,"")).toBe(true);
});
