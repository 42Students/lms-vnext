
import {expect,it} from "vitest";
import {mentorActivityFormLayout} from "@/modules/projects/mentor-portfolio-model";
it("bounds nested form controls so long selected project titles do not size the grid",()=>{
 expect(mentorActivityFormLayout).toContain("grid-cols-1");
 expect(mentorActivityFormLayout).toContain("[&_label]:max-w-full");
 expect(mentorActivityFormLayout).toContain("[&_select]:max-w-full");
 expect(mentorActivityFormLayout).toContain("[&_select]:truncate");
 expect(mentorActivityFormLayout).toContain("[&_input]:min-w-0");
});
