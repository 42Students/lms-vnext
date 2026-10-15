import {it,expect} from "vitest";
import {messagingHistoryCsv} from "@/modules/messaging/receipt-history-export-model";
it("neutralizes formulas in purpose and exports no contact keys",()=>{
 const csv=messagingHistoryCsv([{id:"x",purpose:"=HYPERLINK(1)",total:1,queued:0,sent:1,failed:0,suppressed:0,createdAt:new Date("2026-10-15"),finalizedAt:null}],1);
 expect(csv).toContain("'=HYPERLINK");
 expect(csv).not.toContain("recipient_key");
 expect(csv).toContain("matching_total");
});
