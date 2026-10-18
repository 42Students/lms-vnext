import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {signTpoBulkPreview} from "@/modules/placements/tpo-bulk-preview-token";
import {tpoBulkPreviewRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";
import {tpoBulkStudentVersion} from "@/modules/placements/tpo-bulk-decision-model";

const mocks=vi.hoisted(()=>({
 load:vi.fn(),read:vi.fn(),decide:vi.fn(),audit:vi.fn(),
 review:vi.fn(),notes:vi.fn(),move:vi.fn(),send:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/auth/config",()=>({getAuthConfig:()=>({secret:"local-test-secret-not-for-deployment"})}));
vi.mock("@/modules/activity/service",()=>({recordActivityEvent:mocks.audit}));
vi.mock("@/modules/placements/tpo-bulk-action-preview-service",()=>({loadTpoBulkCurrent:mocks.load}));
vi.mock("@/modules/placements/tpo-participation-service",()=>({
 getTpoLearnerParticipation:mocks.read,decideTpoLearnerParticipation:mocks.decide,
 TpoParticipationConflictError:class extends Error{},
}));
vi.mock("@/modules/placements/tpo-applicant-review-service",()=>({reviewTpoApplicant:mocks.review}));
vi.mock("@/modules/placements/applicant-notes-service",()=>({addTpoApplicantNote:mocks.notes}));
vi.mock("@/modules/placements/tpo-bulk-application-stage-service",()=>({
 moveTpoBulkApplicationStage:mocks.move,TpoBulkStageError:class extends Error{},
}));
vi.mock("@/modules/placements/tpo-bulk-applicant-message-service",()=>({sendTpoBulkApplicationMessage:mocks.send}));
import {confirmTpoBulkAction,TpoBulkPreviewError} from "@/modules/placements/tpo-bulk-action-confirm-service";

const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const COLLEGE="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const ORG="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const context:RequestContext={
 user:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",identityUid:"tpo-test",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"ffffffff-ffff-4fff-8fff-ffffffffffff",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
};
const direct={status:null,reason:null,note:null,updatedAt:null};
const version=tpoBulkStudentVersion(direct);
const plan=tpoBulkPreviewRequestSchema.parse({
 target:"STUDENTS",action:"ELIGIBLE",ids:[A,B],note:"",
});
const selections=[{id:A,version},{id:B,version}];
const actor=context.user.id+":"+context.membership!.id;
function request(changes:Record<string,unknown>={}){
 return {...plan,selections,previewToken:signTpoBulkPreview(
  "local-test-secret-not-for-deployment",actor,plan,selections),
  confirmed:true,acknowledged:true,...changes};
}
describe("TPO-BREAK-bulk-rows-01 partially committed results and audit failure",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.load.mockResolvedValue(new Map([[A,{ready:true,version}],[B,{ready:true,version}]]));
  mocks.read.mockResolvedValue({direct});
  mocks.decide.mockResolvedValue({changed:true,actionId:A,
   direct:{...direct,updatedAt:"2026-10-18T12:00:00.000Z"}});
  mocks.audit.mockResolvedValue({id:B});
 });
 it("returns accurate successes plus failed rows without replaying earlier persisted mutations",async()=>{
  mocks.decide.mockResolvedValueOnce({changed:true,actionId:A,
   direct:{...direct,updatedAt:"2026-10-18T12:00:00.000Z"}})
   .mockRejectedValueOnce(new Error("database connection interrupted"));
  mocks.audit.mockRejectedValueOnce(new Error("audit database down"));
  const result=await confirmTpoBulkAction(context,request());
  expect(result.outcomes.map(row=>row.status)).toEqual(["updated","failed"]);
  expect(result.counts).toEqual({updated:1,skipped:0,failed:1});
  expect(result.summaryRecorded).toBe(false);
  expect(result.summaryWarning).toContain("Refresh and review history");
  expect(result.runAuditId).toBeNull();
  expect(JSON.stringify(result)).not.toContain("database connection interrupted");
  expect(mocks.decide).toHaveBeenCalledTimes(2);
 });
 it("keeps persisted undo handle only when the summary write succeeded",async()=>{
  const result=await confirmTpoBulkAction(context,request());
  expect(result.counts.updated).toBe(2);
  expect(result.summaryRecorded).toBe(true);
  expect(result.summaryWarning).toBeNull();
  expect(result.runAuditId).toBe(B);
  expect(mocks.audit).toHaveBeenCalledTimes(1);
 });
 it("skips stale versions rather than blindly overwriting changed student decisions",async()=>{
  mocks.load.mockResolvedValue(new Map([
   [A,{ready:true,version:"stale"}],[B,{ready:true,version}],
  ]));
  const result=await confirmTpoBulkAction(context,request());
  expect(result.outcomes.map(row=>row.status)).toEqual(["skipped","updated"]);
  expect(mocks.decide).toHaveBeenCalledTimes(1);
 });
 it("refuses tampered selection order, absent acknowledgement and invalid token before any write",async()=>{
  await expect(confirmTpoBulkAction(context,request({
   selections:[selections[1],selections[0]],
  }))).rejects.toBeInstanceOf(TpoBulkPreviewError);
  await expect(confirmTpoBulkAction(context,request({
   previewToken:"expired-token-string",
  }))).rejects.toBeInstanceOf(TpoBulkPreviewError);
  await expect(confirmTpoBulkAction(context,request({
   action:"INELIGIBLE",note:"not ready",acknowledged:false,
  }))).rejects.toBeDefined();
  expect(mocks.read).not.toHaveBeenCalled();
  expect(mocks.decide).not.toHaveBeenCalled();
 });
});

describe("TPO-BREAK-bulk-rows-02 partial confirmation does not discard retry-safe work",()=>{
 it("retains failed and skipped row selection after successful rows are removed",async()=>{
  const {readFileSync}=await import("node:fs");
  const {resolve}=await import("node:path");
  const source=readFileSync(resolve(process.cwd(),"src/components/tpo/tpo-bulk-action-panel.tsx"),"utf8");
  expect(source).toContain('response.outcomes.filter(row=>row.status==="updated")');
  expect(source).toContain("setSelected(current=>current.filter(id=>!completed.has(id)))");
  expect(source).not.toContain("setSelected(current=>current.filter(id=>!plan.ids.includes(id)))");
  expect(source).toContain("response.summaryRecorded===false");
  expect(source).toContain("summaryWarning");
 });
});
