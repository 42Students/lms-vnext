import {expect,it} from "vitest";
import {tpoNoticeCreateSchema} from "@/modules/announcements/tpo-placement-write-service";
it("does not allow the caller to spoof a college receiver or audience size",()=>{
 expect(tpoNoticeCreateSchema.safeParse({
  title:"Notice",message:"All members",pinned:false,receiverType:"LEARNER",
 })).toMatchObject({success:false});
 expect(tpoNoticeCreateSchema.safeParse({title:"Notice",message:"All members",pinned:false}).success).toBe(true);
});
