import {expect,it} from "vitest";
import {facultyVideosForLesson,type FacultyLessonVideo} from "@/modules/courses/faculty-video-management-model";
it("shows shared videos and exact-Section videos without foreign lesson items",()=>{
 const common={lessonId:"lesson-a",deliveryId:null,contentId:"shared"};
 const rows=[common,{...common,contentId:"own",deliveryId:"section-a"},{...common,contentId:"foreign",deliveryId:"section-b"},{...common,contentId:"different",lessonId:"lesson-b"}] as FacultyLessonVideo[];
 expect(facultyVideosForLesson(rows,{lessonId:"lesson-a",deliveryId:"section-a"}).map(x=>x.contentId)).toEqual(["shared","own"]);
 expect(facultyVideosForLesson(rows,{lessonId:"lesson-a",deliveryId:null}).map(x=>x.contentId)).toEqual(["shared"]);
});