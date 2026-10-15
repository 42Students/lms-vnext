import {expect,it} from "vitest";
import {learnerPlacementNoticeFeed} from "@/modules/placements/learner-placement-announcement-model";
it("keeps authorized college notices with valid dates while excluding invalid dated records",()=>{
 const rows=[{id:"a",title:"A",message:"M",createdAt:new Date("bad"),isPinned:false,senderType:"TPO"},
 {id:"b",title:"B",message:"M",createdAt:new Date("2026-10-15T00:00:00Z"),isPinned:true,senderType:"TPO"}];
 const notices=learnerPlacementNoticeFeed(rows);
 expect(notices).toHaveLength(1);
 expect(notices[0].id).toBe("b");
 expect(notices[0].senderLabel).toBe("Placement cell");
});
