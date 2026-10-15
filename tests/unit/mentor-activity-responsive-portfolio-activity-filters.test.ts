import {expect,it} from "vitest";
import {mentorActivityFormLayout} from "@/modules/projects/mentor-portfolio-model";
it("keeps the Mentor activity filter grid shrinkable at 375px with long project choices",()=>{
 expect(mentorActivityFormLayout).toContain("grid-cols-1");
 expect(mentorActivityFormLayout).toContain("sm:grid-cols-2");
 expect(mentorActivityFormLayout).toContain("[&_select]:min-w-0");
 expect(mentorActivityFormLayout).toContain("[&_label]:min-w-0");
});
