import {it,expect} from "vitest";
import {senderTypeForTpoTab,tpoAnnouncementTabSchema} from "@/modules/announcements/tpo-placement-read-model";
it("never mixes the 42 platform tab with college-authored notices",()=>{
 expect(senderTypeForTpoTab("from-42")).toBe("SUPER_ADMIN");
 expect(senderTypeForTpoTab("yours")).toBe("TPO");
 expect(tpoAnnouncementTabSchema.safeParse("learner").success).toBe(false);
});
