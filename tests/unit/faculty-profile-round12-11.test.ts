import {it,expect} from "vitest";
import {facultyProfileReloadRequired} from "@/modules/people/faculty-profile-error-model";
it("offers reload for typed and uncoded stale-profile conflicts",()=>{
 expect(facultyProfileReloadRequired("FACULTY_PROFILE_VERSION_CONFLICT",400)).toBe(true);
 expect(facultyProfileReloadRequired(undefined,409)).toBe(true);
 expect(facultyProfileReloadRequired(undefined,422)).toBe(false);
});
