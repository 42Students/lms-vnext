import {expect,it,vi} from "vitest";
import {deliverBatch,validOutboundBatchId} from "@/modules/messaging/service";
it.each([""," invalid","header\nspoof","../file","a".repeat(121)])(
 "rejects an unsafe outbound batch ID %s",value=>expect(validOutboundBatchId(value)).toBe(false));
it.each(["batch","batch:2026-10-15","7a-uuid"])(
 "accepts an opaque bounded batch ID %s",value=>expect(validOutboundBatchId(value)).toBe(true));
it("does not persist or send if the batch identifier is unsafe",async()=>{
 const provider={send:vi.fn(async()=>true)},repository={insert:vi.fn(async()=>{}),
  update:vi.fn(async()=>{}),auditBatch:vi.fn(async()=>{})};
 await expect(deliverBatch({batchId:"bad\nname",requests:[],provider,repository,
 policyFor:async()=>{throw Error("should not run");},
 recipientKeyFor:async()=>{throw Error("should not run");}})).rejects.toThrow("INVALID_OUTBOUND_BATCH_ID");
 expect(provider.send).not.toHaveBeenCalled();
 expect(repository.auditBatch).not.toHaveBeenCalled();
});
