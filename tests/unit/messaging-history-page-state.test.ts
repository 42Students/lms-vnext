import {it,expect} from "vitest";
import {messagingHistoryQuerySchema} from "@/modules/messaging/receipt-history-model";
it("parses pagination with registered bounds",()=>{
 expect(messagingHistoryQuerySchema.parse({page:"1"}).page).toBe(1);
 expect(messagingHistoryQuerySchema.safeParse({page:"-10"}).success).toBe(false);
});
