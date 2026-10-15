import {it,expect} from "vitest";
import {hrOpenRecruiterConversationSchema} from "@/modules/placements/hr-conversation-open-model";
const id="11111111-1111-4111-8111-111111111111";
it("requires exact selected college and rejects spoofed recruiter identity",()=>{
 expect(hrOpenRecruiterConversationSchema.safeParse({collegeId:id,jobId:id}).success).toBe(true);
 expect(hrOpenRecruiterConversationSchema.safeParse({collegeId:id}).success).toBe(true);
 expect(hrOpenRecruiterConversationSchema.safeParse({collegeId:id,recruiterUserId:id}).success).toBe(false);
});
