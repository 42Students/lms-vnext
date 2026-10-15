import {expect,it} from "vitest";
import {hrReplySuccess,hrReplyErrorMessage} from "@/modules/placements/hr-conversation-send-feedback-model";
it("never treats an error or unrelated redirect as a successful send",()=>{
 const threadId="11111111-1111-4111-8111-111111111111";
 expect(hrReplySuccess({status:200,redirected:true,redirectPath:"/hr/conversations/"+threadId,threadId})).toBe(true);
 expect(hrReplySuccess({status:200,redirected:true,redirectPath:"/login",threadId})).toBe(false);
 expect(hrReplySuccess({status:409,redirected:false,redirectPath:"",threadId})).toBe(false);
 expect(hrReplyErrorMessage(403)).toContain("access");
});
