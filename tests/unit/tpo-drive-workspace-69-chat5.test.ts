import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {groupTpoBulkExceptions} from "@/modules/placements/tpo-bulk-exception-groups";
import {tpoBulkConfirmRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";

describe("TPO-drive-workspace-69 grouped bulk exceptions",()=>{
 it("TPO-drive-workspace-69 groups skipped and failed outcomes by friendly reason without exposing unknown IDs",()=>{
  const groups=groupTpoBulkExceptions([
   {id:"first",status:"skipped",reason:"Application changed"},
   {id:"second",status:"updated",reason:null},
   {id:"third",status:"failed",reason:"Application changed"},
   {id:"hidden",status:"skipped",reason:null},
  ],new Map([["first","Roll 31"],["third","Roll 42"]]));
  expect(groups).toEqual([
   {reason:"Application changed",count:2,names:["Roll 31","Roll 42"]},
   {reason:"Not applied",count:1,names:["Selected applicant"]},
  ]);
  expect(JSON.stringify(groups)).not.toContain("hidden");
 });
 it("TPO-drive-workspace-69 shows grouped failures, retry preview and audited per-run results",()=>{
  const ui=readFileSync("src/components/tpo/tpo-bulk-action-panel.tsx","utf8");
  const service=readFileSync("src/modules/placements/tpo-bulk-action-confirm-service.ts","utf8");
  expect(ui).toContain("groupTpoBulkExceptions(outcomes,labelsById)");
  expect(ui).toContain("Not applied by reason");
  expect(ui).toContain("Retry skipped/failed");
  expect(ui).toContain("Copy failed");
  expect(ui).toContain("acknowledged");
  expect(service).toContain("PLACEMENTS_BULK_RUN");
  expect(service).toContain("safeBulkActionFailure()");
 });
 it("TPO-drive-workspace-69 requires confirmation and consequence acknowledgement for serious actions",()=>{
  const plan={
   target:"APPLICATIONS",jobId:"11111111-1111-4111-8111-111111111111",
   action:"REJECTED",note:"Appropriate review reason",ids:["22222222-2222-4222-8222-222222222222"],
   selections:[{id:"22222222-2222-4222-8222-222222222222",version:"2099-01-01T00:00:00.000Z"}],
   previewToken:"a".repeat(40),confirmed:true,
  };
  expect(tpoBulkConfirmRequestSchema.safeParse({...plan,acknowledged:false}).success).toBe(false);
  expect(tpoBulkConfirmRequestSchema.safeParse({...plan,acknowledged:true}).success).toBe(true);
 });
});
