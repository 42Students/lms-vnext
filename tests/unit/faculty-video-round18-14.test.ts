import {expect,it} from "vitest";
import {facultyVideoCanEnableVisibility,facultyVideoVisibilityIntentSchema,type FacultyLessonVideo} from "@/modules/courses/faculty-video-management-model";
const id="11111111-1111-4111-8111-111111111111";
it("confirms visibility changes only for ready published video and permits no loose fields",()=>{
 const row={processingStatus:"READY",contentStatus:"PUBLISHED"} as FacultyLessonVideo;
 expect(facultyVideoCanEnableVisibility(row,{canManage:true,lessonPublished:true})).toBe(true);
 expect(facultyVideoCanEnableVisibility(row,{canManage:false,lessonPublished:true})).toBe(false);
 expect(facultyVideoCanEnableVisibility({...row,processingStatus:"FAILED"},{canManage:true,lessonPublished:true})).toBe(false);
 const command={action:"SET_VISIBILITY",contentId:id,lessonId:id,deliveryId:null,visibleToStudents:true,expectedUpdatedAt:"2026-10-15T18:00:00Z",confirmed:true};
 expect(facultyVideoVisibilityIntentSchema.safeParse(command).success).toBe(true);
 expect(facultyVideoVisibilityIntentSchema.safeParse({...command,confirmed:false}).success).toBe(false);
 expect(facultyVideoVisibilityIntentSchema.safeParse({...command,playbackUrl:"https://secret"}).success).toBe(false);
});