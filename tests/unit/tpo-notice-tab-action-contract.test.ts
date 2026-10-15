import {it,expect} from "vitest";
import {tpoAnnouncementTabSchema} from "@/modules/announcements/tpo-placement-read-model";
it("supports the private deleted view without leaking it into platform notices",()=>{
 expect(tpoAnnouncementTabSchema.safeParse("deleted").success).toBe(true);
 expect(tpoAnnouncementTabSchema.safeParse("from-42").success).toBe(true);
});
