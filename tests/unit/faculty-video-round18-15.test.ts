import {expect,it} from "vitest";
import {facultyVideoCardActions,type FacultyLessonVideo} from "@/modules/courses/faculty-video-management-model";
it("shows only eligible row actions and never exposes controls to unauthorized Faculty",()=>{
 const row={processingStatus:"READY",contentStatus:"PUBLISHED",visibleToStudents:false} as FacultyLessonVideo;
 expect(facultyVideoCardActions(row,{canManage:false,lessonPublished:true})).toEqual([]);
 expect(facultyVideoCardActions(row,{canManage:true,lessonPublished:true})).toEqual(["REPLACE","ARCHIVE","SHOW"]);
 expect(facultyVideoCardActions({...row,processingStatus:"PROCESSING"},{canManage:true,lessonPublished:true})).toEqual(["ARCHIVE"]);
 expect(facultyVideoCardActions({...row,visibleToStudents:true},{canManage:true,lessonPublished:true})).toContain("HIDE");
 expect(facultyVideoCardActions({...row,contentStatus:"ARCHIVED"},{canManage:true,lessonPublished:true})).toEqual([]);
});