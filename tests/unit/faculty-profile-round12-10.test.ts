import {it,expect} from "vitest";
import {facultyProfileSaveSectionLabel} from "@/modules/people/faculty-profile-error-model";
it("reports the saving section without emitting edited personal values",()=>{
 expect(facultyProfileSaveSectionLabel("personalDetails")).toBe("Personal details");
 expect(facultyProfileSaveSectionLabel("address")).toBe("Address");
 expect(facultyProfileSaveSectionLabel("not-a-section")).toBe("Profile");
});
