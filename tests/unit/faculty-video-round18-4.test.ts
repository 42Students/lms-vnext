import {expect,it} from "vitest";
import {facultyLessonVideoSchema} from "@/modules/courses/faculty-video-management-model";
const id="11111111-1111-4111-8111-111111111111";
it("accepts safe video metadata but rejects storage secrets and noncanonical shapes",()=>{
 const item={contentId:id,lessonId:id,deliveryId:null,title:"Lecture",sequence:0,durationSeconds:null,processingStatus:"READY",contentStatus:"DRAFT",visibleToStudents:false,updatedAt:"2026-10-15T12:00:00Z"};
 expect(facultyLessonVideoSchema.parse(item).title).toBe("Lecture");
 expect(facultyLessonVideoSchema.safeParse({...item,playbackUrl:"https://secret"}).success).toBe(false);
 expect(facultyLessonVideoSchema.safeParse({...item,processingStatus:"UNKNOWN"}).success).toBe(false);
 expect(facultyLessonVideoSchema.safeParse({...item,deliveryId:"forged"}).success).toBe(false);
});