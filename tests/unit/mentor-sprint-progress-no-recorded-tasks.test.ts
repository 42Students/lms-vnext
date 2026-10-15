import {expect,it} from "vitest";
import {mentorSprintProgressQuerySchema as schema,mentorSprintProgressHref as href} from "@/modules/projects/mentor-sprint-progress-model";
it("supports scoped no-recorded-tasks Sprint task attention and carries it into navigation",()=>{
 const query=schema.parse({taskAttention:"NO_TASKS",page:2});
 expect(query.taskAttention).toBe("NO_TASKS");
 expect(href(query)).toContain("taskAttention=NO_TASKS");
 expect(href(query)).toContain("page=2");
 expect(schema.safeParse({taskAttention:"UNREGISTERED"}).success).toBe(false);
});
