import {expect,it} from "vitest";
import {mentorActivityPagination} from "@/modules/projects/mentor-portfolio-model";
it("clamps an out-of-range portfolio activity page before scoped SQL offsets",()=>{
 expect(mentorActivityPagination(21,9999,20)).toEqual({total:21,page:2,pageSize:20,totalPages:2});
 expect(mentorActivityPagination(0,10,50)).toEqual({total:0,page:1,pageSize:50,totalPages:1});
});
