import {expect,it} from "vitest";
import {facultyFilterLessonVideos,type FacultyLessonVideo} from "@/modules/courses/faculty-video-management-model";
it("filters only safe titles and clear statuses",()=>{
 const rows=[{title:"Intro Video",processingStatus:"READY"},{title:"Deep Dive",processingStatus:"FAILED"}] as FacultyLessonVideo[];
 expect(facultyFilterLessonVideos(rows,{search:"  intro ",status:"ALL"}).length).toBe(1);
 expect(facultyFilterLessonVideos(rows,{search:"",status:"FAILED"}).map(x=>x.title)).toEqual(["Deep Dive"]);
 expect(facultyFilterLessonVideos(rows,{search:"intro",status:"FAILED"})).toEqual([]);
});