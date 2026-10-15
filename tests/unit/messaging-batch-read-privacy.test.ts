import {it,expect} from "vitest";
import {messagingHistoryQuerySchema} from "@/modules/messaging/receipt-history-model";
it("does not permit caller-supplied college in receipt read filters",()=>{
 expect(messagingHistoryQuerySchema.safeParse({collegeId:"another-college"}).success).toBe(false);
});
