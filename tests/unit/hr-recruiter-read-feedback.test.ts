import {expect,it} from "vitest";
import {hrReplySuccess} from "@/modules/placements/hr-conversation-send-feedback-model";
it("read action feedback does not treat a login redirect as acknowledgement",()=>{
 const threadId="11111111-1111-4111-8111-111111111111";
 expect(hrReplySuccess({threadId,status:200,redirected:true,redirectPath:"/login"})).toBe(false);
 expect(hrReplySuccess({threadId,status:200,redirected:true,
  redirectPath:"/hr/conversations/"+threadId})).toBe(true);
});
