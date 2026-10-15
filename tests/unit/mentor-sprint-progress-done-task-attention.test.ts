import {expect,it} from "vitest";
import {mentorSprintProgressQuerySchema as schema,mentorSprintProgressHref as href} from "@/modules/projects/mentor-sprint-progress-model";
it("supports scoped done-task-attention Sprint task attention and carries it into navigation",()=>{
 const query=schema.parse({taskAttention:"DONE",page:2});
 expect(query.taskAttention).toBe("DONE");
 expect(href(query)).toContain("taskAttention=DONE");
 expect(href(query)).toContain("page=2");
 expect(schema.safeParse({taskAttention:"UNREGISTERED"}).success).toBe(false);
});
