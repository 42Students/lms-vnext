import {it,expect} from "vitest";
import {removeFacultySkillDraft} from "@/modules/people/faculty-profile-draft-actions";
it("removes only a matching skill and leaves input unchanged",()=>{
 const skills=[{id:"a",skill:"Java"},{id:"b",skill:"React"}];
 expect(removeFacultySkillDraft(skills,"a")).toEqual([skills[1]]);
 expect(removeFacultySkillDraft(skills,"missing")).toEqual(skills);
 expect(skills).toHaveLength(2);
});
