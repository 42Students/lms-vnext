
import {expect,it} from "vitest";
import {mentorProjectActivityHref,mentorProjectActivityQuerySchema} from "@/modules/projects/mentor-project-activity-model";
const projectId="11111111-1111-4111-8111-111111111111";
it("clears all project-history constraints including page size",()=>{
 const query=mentorProjectActivityQuerySchema.parse({projectId,importance:"HIGH",view:"DELIVERIES",window:"LAST_90_DAYS",order:"OLDEST",pageSize:50,page:5});
 const href=mentorProjectActivityHref({...query,importance:"ALL",view:"ALL",window:"ALL",order:"NEWEST",pageSize:20,page:1});
 expect(href).toBe("/mentor/projects/"+projectId+"/activity-history");
});
