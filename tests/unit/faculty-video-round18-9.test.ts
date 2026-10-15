import {expect,it} from "vitest";
import {facultyVideoListEmptyState} from "@/modules/courses/faculty-video-management-model";
it("separates no videos from filtered results and processing",()=>{
 expect(facultyVideoListEmptyState(0,0,0)).toContain("No videos");
 expect(facultyVideoListEmptyState(4,0,1)).toContain("processing");
 expect(facultyVideoListEmptyState(4,0,0)).toContain("filter");
 expect(facultyVideoListEmptyState(4,1,0)).toBeNull();
});