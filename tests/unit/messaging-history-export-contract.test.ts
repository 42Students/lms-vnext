import {it,expect} from "vitest";
import {messagingHistoryCsv} from "@/modules/messaging/receipt-history-export-model";
it("CSV preserves exact intended and suppressed batch counts",()=>{
 const csv=messagingHistoryCsv([{id:"a",purpose:"notice",total:8,queued:0,sent:3,failed:1,suppressed:4,createdAt:new Date("2026-10-15"),finalizedAt:new Date("2026-10-15")}],8);
 expect(csv).toContain('"notice","8","0","3","1","4"');
});
