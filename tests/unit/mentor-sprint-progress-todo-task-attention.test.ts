import {expect,it} from "vitest";
import {mentorSprintProgressQuerySchema as schema,mentorSprintProgressHref as href} from "@/modules/projects/mentor-sprint-progress-model";
it("supports scoped todo-task-attention Sprint task attention and carries it into navigation",()=>{
 const query=schema.parse({taskAttention:"TODO",page:2});
 expect(query.taskAttention).toBe("TODO");
 expect(href(query)).toContain("taskAttention=TODO");
 expect(href(query)).toContain("page=2");
 expect(schema.safeParse({taskAttention:"UNREGISTERED"}).success).toBe(false);
});
