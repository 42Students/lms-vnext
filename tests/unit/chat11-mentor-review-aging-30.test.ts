
import {expect,it} from "vitest";
import {mentorReviewQuerySchema,selectMentorReviewQueue} from "@/modules/projects/mentor-portfolio-model";
it("validates the 30-day waiting filter and handles its exact cutoff",()=>{
 const now=new Date("2026-10-15T00:00:00Z");
 const alerts=[
  {kind:"REVIEW",key:"old",title:"A",description:"A",projectId:"one",occurredAt:"2026-09-14T23:59:59Z"},
  {kind:"REVIEW",key:"edge",title:"B",description:"B",projectId:"two",occurredAt:"2026-09-15T00:00:00Z"},
 ] as Parameters<typeof selectMentorReviewQueue>[0];
 const result=selectMentorReviewQueue(alerts,"","NEWEST","OLDER_THAN_30_DAYS",now);
 expect(result.map(a=>a.key)).toEqual(["old"]);
 expect(mentorReviewQuerySchema.parse({age:"OLDER_THAN_30_DAYS"}).age).toBe("OLDER_THAN_30_DAYS");
});
