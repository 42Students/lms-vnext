import {it,expect} from "vitest";
import {tpoNoticeLifecycleSchema} from "@/modules/announcements/tpo-placement-notice-lifecycle";
it("does not accept caller-supplied actor or scope on lifecycle operations",()=>{
 expect(tpoNoticeLifecycleSchema.safeParse({noticeId:"11111111-1111-4111-8111-111111111111",action:"DELETE",expectedVersion:2,actorUserId:"forged"}).success).toBe(false);
});
