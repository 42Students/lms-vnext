import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {planTpoBatchLifecycle} from "@/modules/placements/tpo-batch-lifecycle-model";
const source=(path:string)=>readFileSync(path,"utf8");
const now=new Date("2099-05-03T00:00:00Z");
describe("TPO batch retirement and recovery",()=>{
 it("TPO-batches-26 permits never-invited retirement without forging an invite",()=>{
  expect(planTpoBatchLifecycle({invitedAt:null,finishedAt:null,updatedAt:now},
   "FINISH",now.toISOString())).toEqual({changed:true,shouldFinish:true});
  const writer=source("src/modules/placements/tpo-batch-lifecycle-service.ts");
  expect(writer).toContain("invitedAt:null,finishedAt:now");
  expect(writer).toContain("onConflictDoNothing()");
  expect(writer).toContain("invitationNeverSent:true");
 });
 it("TPO-batches-26 rejects a stale version even for previously invited batches",()=>{
  expect(()=>planTpoBatchLifecycle({invitedAt:now,finishedAt:null,updatedAt:now},
   "FINISH","2099-05-02T00:00:00.000Z")).toThrow();
 });
 it("GR-35 and GR-90 confirm retirement by keyboard-reachable checkbox rather than window.confirm",()=>{
  const form=source("src/components/tpo/tpo-batch-lifecycle-control.tsx");
  expect(form).not.toContain("window.confirm");
  expect(form).toContain('type="checkbox"');
  expect(form).toContain("disabled=busy||!reviewed");
  expect(form).toContain('role="alert"');
 });
 it("GR-32 preserves the operator intent on a concurrent update",()=>{
  const form=source("src/components/tpo/tpo-batch-lifecycle-control.tsx");
  expect(form).toContain("This changed while you were working. Your choice is kept.");
  expect(form).toContain("setReviewed(false)");
 });
});
