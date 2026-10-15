import {it,expect} from "vitest";
import {restoreFacultySkills} from "@/modules/people/faculty-profile-draft-actions";
it("restores saved skills without changing the stored array or row references",()=>{
 const original=[{id:"a",skill:"Java",proficiency:"Expert"}];const reset=restoreFacultySkills(original);
 reset[0]!.proficiency="Beginner";expect(original[0]?.proficiency).toBe("Expert");
 expect(reset).not.toBe(original);expect(reset[0]).not.toBe(original[0]);
});
