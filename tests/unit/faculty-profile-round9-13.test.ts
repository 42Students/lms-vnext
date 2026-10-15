import {it,expect} from "vitest";
import {FACULTY_PROFILE_NAV,facultyProfileAnchor} from "@/modules/people/faculty-profile-navigation";
it("lists every actual Faculty self-profile editor exactly once with stable anchors",()=>{
 expect(FACULTY_PROFILE_NAV).toHaveLength(12);
 expect(new Set(FACULTY_PROFILE_NAV.map(item=>item.section)).size).toBe(12);
 expect(new Set(FACULTY_PROFILE_NAV.map(item=>facultyProfileAnchor(item.section))).size).toBe(12);
 expect(facultyProfileAnchor("socialProfiles")).toBe("faculty-socialProfiles");
});
