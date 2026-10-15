
import {expect,it} from "vitest";
import {mentorProjectActivityHref,mentorProjectActivityPage,mentorProjectActivityQuerySchema}
 from "@/modules/projects/mentor-project-activity-model";
const projectId="11111111-1111-4111-8111-111111111111";
it("supports 20 and 50 event pages but rejects unbounded sizes",()=>{
 expect(mentorProjectActivityPage(101,3,50)).toEqual({total:101,pageSize:50,totalPages:3,page:3});
 expect(mentorProjectActivityQuerySchema.parse({projectId,pageSize:50}).pageSize).toBe(50);
 expect(mentorProjectActivityQuerySchema.safeParse({projectId,pageSize:200}).success).toBe(false);
 const href=mentorProjectActivityHref({...mentorProjectActivityQuerySchema.parse({projectId,pageSize:50}),page:2});
 expect(new URL(href,"https://example.test").searchParams.get("pageSize")).toBe("50");
});
