import {expect,it} from "vitest";
import {facultyContentMaySave} from "@/modules/courses/faculty-content-edit-model";
it("rejects repeated and unchanged Blueprint content edits",()=>{
 expect(facultyContentMaySave(false,false,true)).toBe(true);
 expect(facultyContentMaySave(true,false,true)).toBe(false);
 expect(facultyContentMaySave(false,true,true)).toBe(false);
 expect(facultyContentMaySave(false,false,false)).toBe(false);
});
