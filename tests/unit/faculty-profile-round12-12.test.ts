import {it,expect} from "vitest";
import {facultyProfileSavedStatus} from "@/modules/people/faculty-profile-error-model";
it("uses non-sensitive saved confirmation without copying personal values",()=>{
 expect(facultyProfileSavedStatus("education",4)).toBe("Education saved (revision 4).");
 expect(facultyProfileSavedStatus("socialProfiles",5)).not.toContain("https://");
});
