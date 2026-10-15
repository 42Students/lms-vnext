import {it,expect} from "vitest";
import {restoreFacultyTextDraft} from "@/modules/people/faculty-profile-draft-actions";
it("restores a fresh record of original private address and public social values",()=>{
 const initial={currentAddress:"1 College Road",linkedIn:"https://example.com"};
 const restored=restoreFacultyTextDraft(initial);restored.currentAddress="Another";
 expect(initial.currentAddress).toBe("1 College Road");expect(restored).not.toBe(initial);
});
