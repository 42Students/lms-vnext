import {it,expect} from "vitest";
import {hrRecruiterReplySchema} from "@/modules/placements/hr-conversation-reply-model";
const id="11111111-1111-4111-8111-111111111111";
it("rejects client spoofed college and invalid message bodies",()=>{
 expect(hrRecruiterReplySchema.safeParse({threadId:id,body:"Hello"}).success).toBe(true);
 expect(hrRecruiterReplySchema.safeParse({threadId:id,body:" "}).success).toBe(false);
 expect(hrRecruiterReplySchema.safeParse({threadId:id,body:"x".repeat(4001)}).success).toBe(false);
 expect(hrRecruiterReplySchema.safeParse({threadId:id,body:"Hi",collegeId:id}).success).toBe(false);
});
