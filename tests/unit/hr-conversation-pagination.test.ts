import {expect,it} from "vitest";
import {hrConversationQuerySchema,hrConversationPageBounds} from "@/modules/placements/hr-conversation-inbox-model";
it("bounds pages and calculates a stable 20-row pagination window",()=>{
 expect(hrConversationQuerySchema.parse({page:"2"}).page).toBe(2);
 expect(hrConversationQuerySchema.safeParse({page:"10001"}).success).toBe(false);
 expect(hrConversationPageBounds(2,35)).toEqual({page:2,pages:2,first:21,last:35});
 expect(hrConversationPageBounds(1,0)).toEqual({page:1,pages:1,first:0,last:0});
});

it("clamps stale pages to the last available conversation",()=>{
 expect(hrConversationPageBounds(100,23)).toEqual({page:2,pages:2,first:21,last:23});
});
