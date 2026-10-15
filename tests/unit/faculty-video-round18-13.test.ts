import {expect,it} from "vitest";
import {facultyVideoLearnerVisible,facultyVideoVisibilityLabel,type FacultyLessonVideo} from "@/modules/courses/faculty-video-management-model";
it("never implies enrollment access while asset is processing or draft",()=>{
 const row={contentStatus:"PUBLISHED",processingStatus:"READY",visibleToStudents:true} as FacultyLessonVideo;
 expect(facultyVideoLearnerVisible(row,{learnerAuthorized:true,lessonPublished:true})).toBe(true);
 expect(facultyVideoLearnerVisible(row,{learnerAuthorized:false,lessonPublished:true})).toBe(false);
 expect(facultyVideoLearnerVisible({...row,processingStatus:"PROCESSING"},{learnerAuthorized:true,lessonPublished:true})).toBe(false);
 expect(facultyVideoVisibilityLabel({...row,contentStatus:"DRAFT"},true)).toContain("Not published");
 expect(facultyVideoVisibilityLabel({...row,visibleToStudents:false},true)).toContain("Hidden");
});