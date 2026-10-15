import {it,expect} from "vitest";
import {toggleFacultyProfileCollapsed} from "@/modules/people/faculty-profile-repeatable-actions";
it("toggles exactly one profile record's collapsed state",()=>{
 const prior=["a","b"];expect(toggleFacultyProfileCollapsed(prior,"b")).toEqual(["a"]);
 expect(toggleFacultyProfileCollapsed(prior,"c")).toEqual(["a","b","c"]);
 expect(prior).toEqual(["a","b"]);
});
