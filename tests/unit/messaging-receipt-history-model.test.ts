import { expect, it } from "vitest";
import { messagingHistoryQuerySchema, projectMessagingHistory } from "@/modules/messaging/receipt-history-model";
it("retains only aggregate recipient-free history", () => {
  const rows = projectMessagingHistory([{id:"id",purpose:"CAMPAIGN",total:2,queued:0,sent:1,failed:0,suppressed:1,createdAt:new Date("2026-10-15"),finalizedAt:new Date("2026-10-15")}]);
  expect(rows[0]).toMatchObject({acceptedByProvider:1, suppressed:1,status:"FINALIZED"});
  expect(JSON.stringify(rows)).not.toContain("recipientKey");
});
it("bounds page size and does not accept arbitrary filters", () => {
  expect(messagingHistoryQuerySchema.safeParse({page:"2"}).success).toBe(true);
  expect(messagingHistoryQuerySchema.safeParse({page:0}).success).toBe(false);
  expect(messagingHistoryQuerySchema.safeParse({collegeId:"foreign"}).success).toBe(false);
});
