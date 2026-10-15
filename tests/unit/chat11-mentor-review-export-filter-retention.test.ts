import {expect,it} from "vitest";
import {mentorReviewExportHref} from "@/modules/projects/mentor-review-export-model";
import {mentorReviewQuerySchema} from "@/modules/projects/mentor-portfolio-model";
const projectId="11111111-1111-4111-8111-111111111111";
it("retains exact authorized review filters but never exports the current page only",()=>{
 const query=mentorReviewQuerySchema.parse({projectId,assignment:"PRIMARY",age:"OLDER_THAN_7_DAYS",
  order:"OLDEST",search:"Spring",page:5,pageSize:50});
 const url=new URL(mentorReviewExportHref(query),"https://example.test");
 expect(url.pathname).toBe("/api/mentor/reviews/export");
 expect(url.searchParams.get("projectId")).toBe(projectId);
 expect(url.searchParams.get("assignment")).toBe("PRIMARY");
 expect(url.searchParams.get("age")).toBe("OLDER_THAN_7_DAYS");
 expect(url.searchParams.get("order")).toBe("OLDEST");
 expect(url.searchParams.get("search")).toBe("Spring");
 expect(url.searchParams.has("page")).toBe(false);
 expect(url.searchParams.has("pageSize")).toBe(false);
});
