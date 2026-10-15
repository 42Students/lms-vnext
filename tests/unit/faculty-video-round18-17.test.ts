import {expect,it} from "vitest";
import {facultyVideoStatusUpdate,type FacultyLessonVideo} from "@/modules/courses/faculty-video-management-model";
const id="11111111-1111-4111-8111-111111111111";
it("rejects stale, invalid and foreign status polling updates",()=>{
 const old={contentId:id,lessonId:id,deliveryId:null,title:"Lesson",sequence:0,durationSeconds:30,processingStatus:"PROCESSING",contentStatus:"DRAFT",visibleToStudents:false,updatedAt:"2026-10-15T10:00:00Z"} as FacultyLessonVideo;
 const ready={...old,processingStatus:"READY",updatedAt:"2026-10-15T10:01:00Z"};
 expect(facultyVideoStatusUpdate(old,ready)?.processingStatus).toBe("READY");
 expect(facultyVideoStatusUpdate(old,{...ready,updatedAt:old.updatedAt})).toBeNull();
 expect(facultyVideoStatusUpdate(old,{...ready,lessonId:"other"})).toBeNull();
 expect(facultyVideoStatusUpdate(old,{...ready,secretKey:"hidden"})).toBeNull();
});