
import {expect,it} from "vitest";
import {mentorProjectActivityHref,mentorProjectActivityQuerySchema}
 from "@/modules/projects/mentor-project-activity-model";
const projectId="11111111-1111-4111-8111-111111111111";
it("preserves oldest-first chronology across selected project history pages",()=>{
 const parsed=mentorProjectActivityQuerySchema.parse({projectId,order:"OLDEST"});
 expect(parsed.order).toBe("OLDEST");
 const href=mentorProjectActivityHref({...parsed,page:3});
 const uri=new URL(href,"https://example.test");
 expect(uri.searchParams.get("order")).toBe("OLDEST");
 expect(uri.searchParams.get("page")).toBe("3");
 expect(mentorProjectActivityQuerySchema.safeParse({projectId,order:"RANDOM"}).success).toBe(false);
});
