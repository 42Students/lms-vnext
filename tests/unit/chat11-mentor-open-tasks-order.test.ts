
import { expect, it } from "vitest";
import { compareMentorProjectsByOpenTasks as order } from "@/modules/projects/mentor-project-order-model";
import { mentorProjectListQuerySchema } from "@/modules/projects/mentor-project-list-query";
const p=(id:string,status="ACTIVE")=>({id,title:id,status,updatedAt:new Date("2026-10-01T00:00:00Z")});
it("prioritizes more open tasks but keeps archived work last",()=>{
 expect(order(p("a"),p("b"),8,2)).toBeLessThan(0);
 expect(order(p("a"),p("b"),0,3)).toBeGreaterThan(0);
 expect(order(p("a","ARCHIVED"),p("b"),20,1)).toBeGreaterThan(0);
 expect(mentorProjectListQuerySchema.parse({sort:"OPEN_TASKS"}).sort).toBe("OPEN_TASKS");
});
