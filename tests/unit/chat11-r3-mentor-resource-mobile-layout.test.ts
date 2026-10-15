import {expect,it} from "vitest";
import {mentorResourceDirectoryFilterLayout} from "@/modules/projects/mentor-resource-directory-layout-model";
it("constrains labels, text boxes and dropdowns inside a narrow viewport",()=>{
 for(const token of ["min-w-0","max-w-full","flex-wrap","[&_input]:w-full","[&_select]:w-full"])
  expect(mentorResourceDirectoryFilterLayout).toContain(token);
});
