
import {expect,it} from "vitest";
import {mentorProjectActivityPage,mentorProjectActivityQuerySchema} from "@/modules/projects/mentor-project-activity-model";
const projectId="11111111-1111-4111-8111-111111111111";
it("accepts validated 20/50 numeric page sizes and refuses unvalidated callers",()=>{
 const parsed=mentorProjectActivityQuerySchema.parse({projectId,pageSize:"50"});
 expect(mentorProjectActivityPage(70,1,parsed.pageSize)).toMatchObject({pageSize:50,totalPages:2});
 expect(()=>mentorProjectActivityPage(70,1,500)).toThrow("Invalid mentor activity page size");
});
