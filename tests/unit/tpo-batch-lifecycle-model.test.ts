import {describe,expect,it} from "vitest";
import {planTpoBatchLifecycle} from "@/modules/placements/tpo-batch-lifecycle-model";
describe("batch lifecycle versioned transitions",()=>{
 const time=new Date("2099-10-15T08:00:00Z");
 it("TPO-batches-26 allows never-invited retirement and subsequent reopening",()=>{
  expect(planTpoBatchLifecycle({invitedAt:null,finishedAt:null,updatedAt:time},"FINISH",time.toISOString())).toMatchObject({changed:true,shouldFinish:true});
  expect(planTpoBatchLifecycle({invitedAt:time,finishedAt:null,updatedAt:time},"FINISH",time.toISOString()).changed).toBe(true);
  expect(planTpoBatchLifecycle({invitedAt:time,finishedAt:time,updatedAt:time},"REOPEN",time.toISOString()).changed).toBe(true);
 });
 it("checks version before no-op decisions",()=>{
  expect(()=>planTpoBatchLifecycle({invitedAt:time,finishedAt:time,updatedAt:time},"FINISH","stale")).toThrow("BATCH_ACTION_STALE");
 });
});
