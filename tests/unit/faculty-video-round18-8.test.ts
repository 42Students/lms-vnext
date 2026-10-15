import {expect,it} from "vitest";
import {facultyOrderLessonVideos,type FacultyLessonVideo} from "@/modules/courses/faculty-video-management-model";
it("orders by persisted lesson sequence with stable title and id ties",()=>{
 const rows=[{contentId:"b",title:"Zulu",sequence:1},{contentId:"c",title:"Alpha",sequence:0},{contentId:"a",title:"Zulu",sequence:1}] as FacultyLessonVideo[];
 expect(facultyOrderLessonVideos(rows).map(x=>x.contentId)).toEqual(["c","a","b"]);
 expect(rows.map(x=>x.contentId)).toEqual(["b","c","a"]);
});