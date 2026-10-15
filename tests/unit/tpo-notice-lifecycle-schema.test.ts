import {it,expect} from "vitest";
import {tpoNoticeLifecycleSchema} from "@/modules/announcements/tpo-placement-notice-lifecycle";
const id="11111111-1111-4111-8111-111111111111";
it("requires explicit versioned actions; no foreign scope or arbitrary edits",()=>{
 expect(tpoNoticeLifecycleSchema.safeParse({noticeId:id,action:"DELETE",expectedVersion:0}).success).toBe(true);
 expect(tpoNoticeLifecycleSchema.safeParse({noticeId:id,action:"RESTORE",expectedVersion:-1}).success).toBe(false);
 expect(tpoNoticeLifecycleSchema.safeParse({noticeId:id,action:"EDIT",expectedVersion:0}).success).toBe(false);
 expect(tpoNoticeLifecycleSchema.safeParse({noticeId:id,action:"DELETE",expectedVersion:0,collegeId:id}).success).toBe(false);
});
