import {it,expect} from "vitest";
import {facultyProfileUnconfirmedSaveMessage} from "@/modules/people/faculty-profile-error-model";
it("never falsely asserts a malformed success receipt was rolled back",()=>{
 const msg=facultyProfileUnconfirmedSaveMessage();
 expect(msg).toMatch(/may have been saved/i);
 expect(msg).toMatch(/before submitting/i);
 expect(msg).not.toMatch(/nothing was saved/i);
});
