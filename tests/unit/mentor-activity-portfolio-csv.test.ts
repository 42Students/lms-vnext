import {expect,it} from "vitest";
import {mentorActivityQuerySchema} from "@/modules/projects/mentor-portfolio-model";
import {mentorPortfolioActivityCsv as csv,mentorPortfolioActivityExportHref as href} from "@/modules/projects/mentor-portfolio-activity-export-model";
it("exports only safe scoped Mentor event fields with formula-neutralized names",()=>{
 const out=csv([{id:"event-1",projectTitle:"=HYPERLINK(\"https://bad\")",
  label:"Project created",importance:"HIGH",occurredAt:new Date("2026-10-15T03:30:00Z")}],2);
 expect(out).toContain("Event ID,Project,Recorded event,Importance,Occurred (IST)");
 expect(out).toContain("'=HYPERLINK");
 expect(out).toContain("2 additional matching events");
 expect(out).not.toContain("actor_user_id");
 expect(out).not.toContain("metadata");
 const q=mentorActivityQuerySchema.parse({search:"Atlas",view:"EVALUATIONS",window:"PAST_90_DAYS",page:3});
 const url=href(q);
 expect(url).toContain("/api/mentor/activity/export?");
 expect(url).toContain("view=EVALUATIONS");
 expect(url).toContain("search=Atlas");
 expect(url).not.toContain("page=3");
});
