import {expect,it,vi} from "vitest";
import {facultyContentMayChangeOpen} from "@/modules/courses/faculty-content-edit-model";
it("requires confirmation for dirty dismissal and forbids closing during save",()=>{
 const confirm=vi.fn(()=>false);
 expect(facultyContentMayChangeOpen(false,true,false,confirm)).toBe(false);
 expect(confirm).toHaveBeenCalledOnce();
 expect(facultyContentMayChangeOpen(false,false,false,confirm)).toBe(true);
 expect(confirm).toHaveBeenCalledOnce();
 expect(facultyContentMayChangeOpen(false,true,true,confirm)).toBe(false);
 expect(confirm).toHaveBeenCalledOnce();
 expect(facultyContentMayChangeOpen(true,true,false,confirm)).toBe(true);
 expect(facultyContentMayChangeOpen(false,true,false,()=>true)).toBe(true);
});
