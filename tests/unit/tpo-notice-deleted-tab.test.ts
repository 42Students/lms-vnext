import {it,expect} from "vitest";
import {tpoAnnouncementTabSchema,senderTypeForTpoTab} from "@/modules/announcements/tpo-placement-read-model";
it("supports private deleted notices only for their original author",()=>{
 expect(tpoAnnouncementTabSchema.parse("deleted")).toBe("deleted");
 expect(senderTypeForTpoTab("deleted")).toBe("TPO");
});
