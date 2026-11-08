import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {mentorReviewVersionHref} from "@/modules/projects/mentor-review-completeness-model";

const page=readFileSync(join(process.cwd(),
  "src/app/(authenticated)/mentor/projects/[projectId]/review-completeness/page.tsx"),"utf8");

describe("UX-G071 Mentor delivery review drilldown",()=>{
  it("navigates to the registered authorized version page",()=>{
    expect(mentorReviewVersionHref("project-1","submission-2"))
      .toBe("/mentor/projects/project-1/deliveries/submission-2/review");
  });
  it("encodes identifiers to prevent path or query breakout",()=>{
    const href=mentorReviewVersionHref("a/b?x=1","c#d");
    expect(href).toBe("/mentor/projects/a%2Fb%3Fx%3D1/deliveries/c%23d/review");
    expect(href).not.toContain("?x=1");
  });
  it("offers a per-version accessible detail link, not a dead-end list",()=>{
    expect(page).toContain("href={mentorReviewVersionHref(projectId,item.id)}");
    expect(page).toContain('aria-label={"View delivery version "+item.version+" details"}');
  });
  it("recovers from a bad page selector without losing the project",()=>{
    expect(page).toContain('href={"/mentor/projects/"+encodeURIComponent(projectId)+"/review-completeness"}');
    expect(page).toContain("Clear invalid filters");
  });
  it("announces all five G071 loading states to assistive technology",()=>{
    for(const segment of [
      "closeout","deliveries/[submissionId]/review",
      "meetings/[meetingId]/notes","resources-directory","review-completeness",
    ]){
      const source=readFileSync(join(process.cwd(),
        "src/app/(authenticated)/mentor/projects/[projectId]",segment,"loading.tsx"),"utf8");
      expect(source,segment).toContain('aria-busy="true"');
      expect(source,segment).toContain("GracefulPageLoading");
    }
  });
  it("offers a return to the same project's full version history",()=>{
    const detail=readFileSync(join(process.cwd(),
      "src/app/(authenticated)/mentor/projects/[projectId]/deliveries/[submissionId]/review/page.tsx"),"utf8");
    expect(detail).toContain('href={"/mentor/projects/"+encodeURIComponent(data.projectId)+"/review-completeness"}');
    expect(detail).toContain("All delivery versions");
  });
});
