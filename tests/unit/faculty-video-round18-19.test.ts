import {expect,it} from "vitest";
import {facultyVideoListFilterSchema,facultyFilterLessonVideos,type FacultyLessonVideo} from "@/modules/courses/faculty-video-management-model";
it("rejects oversized, unknown and forged video filters",()=>{
 expect(facultyVideoListFilterSchema.parse({search:"  intro  ",status:"READY"}).search).toBe("intro");
 expect(facultyVideoListFilterSchema.safeParse({search:"a".repeat(121),status:"ALL"}).success).toBe(false);
 expect(facultyVideoListFilterSchema.safeParse({search:"",status:"PRIVATE"}).success).toBe(false);
 expect(facultyVideoListFilterSchema.safeParse({search:"",status:"ALL",storageKey:"secret"}).success).toBe(false);
 expect(facultyFilterLessonVideos([{title:"Intro",processingStatus:"READY"}] as FacultyLessonVideo[],{search:"intro",status:"ALL"})).toHaveLength(1);
});