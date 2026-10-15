import {expect,it} from "vitest";
import {facultyVideoCanReplace,facultyVideoReplacePrompt,type FacultyLessonVideo} from "@/modules/courses/faculty-video-management-model";
it("requires management permission and replacement-safe state",()=>{
 const row={title:"Module 1",contentStatus:"PUBLISHED",processingStatus:"READY"} as FacultyLessonVideo;
 expect(facultyVideoCanReplace(row,true)).toBe(true);
 expect(facultyVideoCanReplace(row,false)).toBe(false);
 expect(facultyVideoCanReplace({...row,processingStatus:"PROCESSING"},true)).toBe(false);
 expect(facultyVideoCanReplace({...row,contentStatus:"ARCHIVED"},true)).toBe(false);
 expect(facultyVideoCanReplace({...row,processingStatus:"FAILED"},true)).toBe(true);
 expect(facultyVideoReplacePrompt(row)).toContain("Module 1");
 expect(facultyVideoReplacePrompt(row)).toContain("unavailable");
});