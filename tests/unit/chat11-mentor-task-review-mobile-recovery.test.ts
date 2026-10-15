import {expect,it} from "vitest";
import {mentorTaskReviewHref,mentorTaskReviewMobileLayout,mentorTaskReviewMobileFilters}
 from "@/modules/projects/mentor-task-review-model";
it("recovers from out-of-range task review pages without losing the active filters",()=>{
 const url=new URL(mentorTaskReviewHref({search:"draft",priority:"HIGH",
  assignment:"PRIMARY",page:1,pageSize:50}),"https://example.test");
 expect(url.searchParams.get("search")).toBe("draft");
 expect(url.searchParams.get("priority")).toBe("HIGH");
 expect(url.searchParams.get("assignment")).toBe("PRIMARY");
 expect(url.searchParams.get("pageSize")).toBe("50");
 expect(url.searchParams.has("page")).toBe(false);
});
it("makes task review filters flexible on narrow mobile widths",()=>{
 expect(mentorTaskReviewMobileLayout).toContain("overflow-x-clip");
 expect(mentorTaskReviewMobileFilters).toContain("[&_input]:min-w-0");
 expect(mentorTaskReviewMobileFilters).toContain("[&_select]:max-w-full");
});
