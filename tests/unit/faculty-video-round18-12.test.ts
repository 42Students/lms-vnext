import {expect,it} from "vitest";
import {facultyVideoArchiveIntentSchema,facultyVideoArchivePrompt,type FacultyLessonVideo} from "@/modules/courses/faculty-video-management-model";
const a="11111111-1111-4111-8111-111111111111";
it("makes learner access loss explicit and requires scoped confirmation",()=>{
 expect(facultyVideoArchivePrompt({title:"Lecture 9"} as FacultyLessonVideo)).toContain("Learners");
 const cmd={action:"ARCHIVE",contentId:a,lessonId:a,deliveryId:null,expectedUpdatedAt:"2026-10-15T14:00:00Z",confirmed:true};
 expect(facultyVideoArchiveIntentSchema.safeParse(cmd).success).toBe(true);
 expect(facultyVideoArchiveIntentSchema.safeParse({...cmd,confirmed:false}).success).toBe(false);
 expect(facultyVideoArchiveIntentSchema.safeParse({...cmd,deleteObject:true}).success).toBe(false);
});