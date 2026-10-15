import {expect,it} from "vitest";
import {hrConversationDetailPageWindow} from "@/modules/placements/hr-conversation-detail-pagination-model";
it("clamps stale message links to an existing chronological page",()=>{
 expect(hrConversationDetailPageWindow(100,41)).toEqual({page:2,pages:2,offset:40});
 expect(hrConversationDetailPageWindow(1,0)).toEqual({page:1,pages:1,offset:0});
 expect(hrConversationDetailPageWindow(2,80)).toEqual({page:2,pages:2,offset:40});
});
