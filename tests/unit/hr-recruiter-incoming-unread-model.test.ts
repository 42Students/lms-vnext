import {expect,it} from "vitest";
import {hrRecruiterReplySchema} from "@/modules/placements/hr-conversation-reply-model";
it("reply validation does not include a read acknowledgement side effect",()=>{
 expect(hrRecruiterReplySchema.safeParse({threadId:"11111111-1111-4111-8111-111111111111",body:"Thanks",markRead:true}).success).toBe(false);
});
