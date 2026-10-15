
import {expect,it} from "vitest";
import {mentorProjectActivityMobileLayout,mentorProjectActivityMobileFilters} from "@/modules/projects/mentor-project-activity-model";
it("keeps history and nested select labels within a narrow viewport",()=>{
 expect(mentorProjectActivityMobileLayout).toContain("max-w-full");
 expect(mentorProjectActivityMobileFilters).toContain("[&_label]:min-w-0");
 expect(mentorProjectActivityMobileFilters).toContain("[&_select]:max-w-full");
});
