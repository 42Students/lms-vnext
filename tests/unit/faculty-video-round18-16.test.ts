import {expect,it} from "vitest";
import {facultyVideoMetadataCsv,type FacultyLessonVideo} from "@/modules/courses/faculty-video-management-model";
it("neutralizes spreadsheet payloads and excludes signed URLs or foreign Sections",()=>{
 const rows=[{lessonId:"l",deliveryId:"s",title:'=HYPERLINK("bad")\r\nline',processingStatus:"READY",contentStatus:"PUBLISHED",visibleToStudents:true,durationSeconds:30,sequence:0,contentId:"c"},{lessonId:"l",deliveryId:"foreign",title:"SECRET",processingStatus:"READY",contentStatus:"PUBLISHED",visibleToStudents:true,durationSeconds:10,sequence:1,contentId:"x"}] as FacultyLessonVideo[];
 const csv=facultyVideoMetadataCsv(rows,{lessonId:"l",deliveryId:"s"});
 expect(csv).toContain("'=HYPERLINK");
 expect(csv).not.toContain("SECRET");
 expect(csv).not.toContain("storageKey");
 expect(csv).not.toContain("playbackUrl");
 expect(csv.split("\r\n").length).toBe(3);
});