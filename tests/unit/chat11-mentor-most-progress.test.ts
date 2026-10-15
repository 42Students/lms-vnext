
import { expect, it } from "vitest";
import { compareMentorProjectsByMostProgress as order } from "@/modules/projects/mentor-project-order-model";
import { mentorProjectListQuerySchema } from "@/modules/projects/mentor-project-list-query";
const project = (id:string,status="ACTIVE")=>({id,title:id,status,updatedAt:new Date("2026-10-01T00:00:00Z")});
it("sorts measured progress descending, never inventing zero for no tasks", () => {
  expect(order(project("one"),project("two"),75,25)).toBeLessThan(0);
  expect(order(project("one"),project("two"),undefined,25)).toBeGreaterThan(0);
  expect(order(project("one","ARCHIVED"),project("two"),100,5)).toBeGreaterThan(0);
  expect(mentorProjectListQuerySchema.parse({sort:"PROGRESS_DESC"}).sort).toBe("PROGRESS_DESC");
});
