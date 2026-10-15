import {expect,it} from "vitest";
import {selectMentorReviewQueue} from "@/modules/projects/mentor-portfolio-model";
import type {MentorProjectAttention} from "@/modules/projects/mentor-attention";
const submitted=new Date("2026-10-08T00:00:00Z").toISOString();
const rows:MentorProjectAttention[]=[{
 projectId:"11111111-1111-4111-8111-111111111111",
 key:"review:1",kind:"REVIEW",title:"Delivery",description:"Assigned project",
 href:"/mentor/projects/1?tab=delivery",occurredAt:submitted,
}];
it("keeps fixed seven-day age boundary stable across a multipage CSV snapshot",()=>{
 const now=new Date("2026-10-15T00:00:00Z");
 const first=selectMentorReviewQueue(rows,"","NEWEST","LAST_7_DAYS",now);
 const next=selectMentorReviewQueue(rows,"","NEWEST","LAST_7_DAYS",now);
 expect(first.map(row=>row.key)).toEqual(next.map(row=>row.key));
 expect(first).toHaveLength(1);
 expect(selectMentorReviewQueue(rows,"","NEWEST","OLDER_THAN_7_DAYS",now)).toHaveLength(0);
});
