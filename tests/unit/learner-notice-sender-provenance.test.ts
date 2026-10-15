import {it,expect} from "vitest";
import {learnerPlacementNoticeFeed,learnerNoticeSourceLabel,learnerNoticeAudienceLabel} from "@/modules/placements/learner-placement-announcement-model";
it("distinguishes persisted publisher and audience without inventing a TPO source",()=>{
 const row={id:"a",title:"Announcement",message:"Test",createdAt:new Date("2026-10-15T00:00:00Z"),isPinned:true,senderType:"TPO",receiverType:"COLLEGE"};
 expect(learnerPlacementNoticeFeed([row])[0]).toMatchObject({senderLabel:"Placement cell",audienceLabel:"College"});
 expect(learnerNoticeSourceLabel("UNKNOWN")).toBeNull();
 expect(learnerNoticeAudienceLabel("EMPLOYER")).toBeNull();
});
