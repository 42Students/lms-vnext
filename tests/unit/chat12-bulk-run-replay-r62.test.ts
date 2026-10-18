import {describe,expect,it} from "vitest";
import {sameTpoBulkRequestRun,persistedTpoBulkRequestCount} from "@/modules/placements/tpo-request-bulk-run-model";
import {readFileSync} from "node:fs";
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const C="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const input={action:"APPROVE" as const,requestIds:[A,B]};
describe("TPO-requests-verification-13: durable bulk request run idempotency",()=>{
 it("TPO-requests-verification-13 accepts exact bulk replay",()=>expect(sameTpoBulkRequestRun(input,input)).toBe(true));
 it("TPO-requests-verification-13 tolerates selected-row ordering changes",()=>expect(sameTpoBulkRequestRun({...input,requestIds:[B,A]},input)).toBe(true));
 it("TPO-requests-verification-13 rejects a reused ID for another action",()=>expect(sameTpoBulkRequestRun({...input,action:"REJECT"},input)).toBe(false));
 it("TPO-requests-verification-13 rejects changed row membership",()=>expect(sameTpoBulkRequestRun({...input,requestIds:[A,C]},input)).toBe(false));
 it("TPO-requests-verification-13 rejects a truncated replay set",()=>expect(sameTpoBulkRequestRun({...input,requestIds:[A]},input)).toBe(false));
 it("TPO-requests-verification-13 rejects extra replay rows",()=>expect(sameTpoBulkRequestRun({...input,requestIds:[A,B,C]},input)).toBe(false));
 it("TPO-requests-verification-13 refuses missing persisted audit metadata",()=>expect(sameTpoBulkRequestRun(null,input)).toBe(false));
 it("TPO-requests-verification-13 refuses a legacy metadata object without request IDs",()=>expect(sameTpoBulkRequestRun({action:"APPROVE"},input)).toBe(false));
 it("TPO-requests-verification-13 refuses a nonarray audit identifier payload",()=>expect(sameTpoBulkRequestRun({...input,requestIds:"bad"},input)).toBe(false));
 it("TPO-requests-verification-13 refuses non-string IDs in persisted metadata",()=>expect(sameTpoBulkRequestRun({...input,requestIds:[A,123]},input)).toBe(false));
 it("TPO-requests-verification-13 refuses duplicate IDs in persisted metadata",()=>expect(sameTpoBulkRequestRun({...input,requestIds:[A,A]},input)).toBe(false));
 it("TPO-requests-verification-13 refuses duplicate IDs in caller input",()=>expect(sameTpoBulkRequestRun({...input,requestIds:[A,B]},{...input,requestIds:[A,A]})).toBe(false));
 it("TPO-requests-verification-13 refuses a zero-row run despite a replayed empty audit",()=>expect(sameTpoBulkRequestRun({action:"APPROVE",requestIds:[]},{action:"APPROVE",requestIds:[]})).toBe(false));
 it("TPO-requests-verification-13 permits nonidentity summary fields in persisted metadata",()=>expect(sameTpoBulkRequestRun({...input,verifiedCount:2},input)).toBe(true));
 it("TPO-requests-verification-13 re-reads a winning audit after concurrent insert conflict",()=>{
  const code=readFileSync(new URL("../../src/modules/placements/tpo-request-bulk-audit-service.ts",import.meta.url),"utf8");
  expect(code).toContain('if(!event){');
  expect(code).toContain('const [winner]=await tx.select({id:activityEvents.id,metadata:activityEvents.metadata})');
  expect(code).toContain('if(!winner||!sameTpoBulkRequestRun(winner.metadata,input))');
 });
 it("TPO-requests-verification-13 reuses only a bounded recorded count, never today's changed status",()=>{
  const recorded={action:"APPROVE",requestIds:[A,B],verifiedCount:1};
  expect(persistedTpoBulkRequestCount(recorded,2)).toBe(1);
  expect(persistedTpoBulkRequestCount({...recorded,verifiedCount:0},2)).toBe(0);
  expect(persistedTpoBulkRequestCount({...recorded,verifiedCount:2},2)).toBe(2);
  for(const invalid of [undefined,null,NaN,Infinity,-1,3,2.5,"1"]){
   expect(persistedTpoBulkRequestCount({...recorded,verifiedCount:invalid},2)).toBeNull();
  }
  expect(persistedTpoBulkRequestCount(recorded,0)).toBeNull();
  expect(persistedTpoBulkRequestCount(recorded,11)).toBeNull();
 });
 it("TPO-requests-verification-13 returns the persisted successful count on a concurrent replay",()=>{
  const code=readFileSync(new URL("../../src/modules/placements/tpo-request-bulk-audit-service.ts",import.meta.url),"utf8");
  expect(code).toContain("persistedTpoBulkRequestCount(winner.metadata,input.requestIds.length)");
  expect(code).toContain("return {eventId:winner.id,replayed:true,verifiedCount}");
  expect(code).toContain("return {eventId:prior.id,replayed:true,verifiedCount}");
  expect(code).toContain("await requireTpoJobActor(tx,ctx)");
 });
 it("TPO-requests-verification-13 actually wires the replay guard into the transactional audit writer",()=>{
  const code=readFileSync(new URL("../../src/modules/placements/tpo-request-bulk-audit-service.ts",import.meta.url),"utf8");
  expect(code).toContain('if(!sameTpoBulkRequestRun(prior.metadata,input))');
  expect(code).toContain('throw new PlacementsServiceError("PLACEMENT_REQUEST_CONFLICT")');
 });
});
