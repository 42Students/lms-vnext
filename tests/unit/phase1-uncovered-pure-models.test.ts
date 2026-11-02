import {describe,expect,it} from "vitest";
import {publishedWorkspaceBriefError,emptyWorkspaceBrief,type WorkspaceBrief} from "@/modules/projects/workspace-brief-model";
import {importedProjectTemplateUuid} from "@/modules/projects/legacy-template-import-model";
import {bulkPlanSchema,bulkPlanFingerprint,isCurrentBulkPlan} from "@/modules/placements/tpo-bulk-plan-model";
import {bulkInviteDisposition,previewTpoBulkInvites,type TpoBulkInviteCandidate} from "@/modules/placements/tpo-bulk-invite-preview-model";

const uuidA="11111111-1111-4111-8111-111111111111";
const uuidB="22222222-2222-4222-8222-222222222222";
const uuidC="33333333-3333-4333-8333-333333333333";

describe("PHASE1-BRIEF publishedWorkspaceBriefError",()=>{
 const brief=(deliverables:string[]):WorkspaceBrief=>({...emptyWorkspaceBrief,deliverables});
 it("PHASE1-BRIEF-01 accepts a brief with at least one non-blank deliverable",()=>{
  expect(publishedWorkspaceBriefError(brief(["Final report"]))).toBeNull();
  expect(publishedWorkspaceBriefError(brief(["","  ","Demo"]))).toBeNull();
 });
 it("PHASE1-BRIEF-02 blocks publishing when there are no deliverables or only blank ones, with the legacy wording",()=>{
  for(const d of [[],[""],["   "],["\n\t"," "]])
   expect(publishedWorkspaceBriefError(brief(d)),JSON.stringify(d)).toBe("Add at least one deliverable.");
 });
 it("PHASE1-BRIEF-03 the empty brief is not publishable",()=>{
  expect(publishedWorkspaceBriefError(emptyWorkspaceBrief)).toBe("Add at least one deliverable.");
 });
});

describe("PHASE1-TEMPLATE-UUID importedProjectTemplateUuid",()=>{
 it("PHASE1-TEMPLATE-UUID-01 is deterministic: the same legacy id always maps to the same UUID",()=>{
  expect(importedProjectTemplateUuid(42)).toBe(importedProjectTemplateUuid(42));
 });
 it("PHASE1-TEMPLATE-UUID-02 produces a well-formed RFC 4122 version-5 UUID",()=>{
  for(const id of [1,2,42,1000,Number.MAX_SAFE_INTEGER])
   expect(importedProjectTemplateUuid(id),String(id)).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
 });
 it("PHASE1-TEMPLATE-UUID-03 distinct legacy ids never collide across a wide range",()=>{
  const seen=new Set<string>();
  for(let id=1;id<=2000;id++)seen.add(importedProjectTemplateUuid(id));
  expect(seen.size).toBe(2000);
 });
 it("PHASE1-TEMPLATE-UUID-04 rejects ids that are not positive safe integers",()=>{
  for(const bad of [0,-1,1.5,Number.NaN,Number.POSITIVE_INFINITY,Number.MAX_SAFE_INTEGER+2,"7" as unknown as number,null as unknown as number])
   expect(()=>importedProjectTemplateUuid(bad),String(bad)).toThrow();
 });
});

describe("PHASE1-BULK-PLAN bulk plan fingerprint and staleness",()=>{
 const plan=(over:Partial<{action:string;scopeId:string;revision:string;rows:{id:string;version:string}[]}>={})=>bulkPlanSchema.parse({
  action:"CLOSE",scopeId:uuidA,revision:"r1",rows:[{id:uuidB,version:"v1"},{id:uuidC,version:"v7"}],...over,
 });
 it("PHASE1-BULK-PLAN-01 an unchanged plan is current",()=>{
  expect(isCurrentBulkPlan(plan(),plan())).toBe(true);
  expect(bulkPlanFingerprint(plan())).toBe(bulkPlanFingerprint(plan()));
 });
 it("PHASE1-BULK-PLAN-02 any change to action, scope, revision or a row version makes the plan stale",()=>{
  const base=plan();
  expect(isCurrentBulkPlan(base,plan({action:"REOPEN"}))).toBe(false);
  expect(isCurrentBulkPlan(base,plan({scopeId:uuidC}))).toBe(false);
  expect(isCurrentBulkPlan(base,plan({revision:"r2"}))).toBe(false);
  expect(isCurrentBulkPlan(base,plan({rows:[{id:uuidB,version:"v2"},{id:uuidC,version:"v7"}]}))).toBe(false);
 });
 it("PHASE1-BULK-PLAN-03 adding, removing or reordering a row makes the plan stale",()=>{
  const base=plan();
  expect(isCurrentBulkPlan(base,plan({rows:[{id:uuidB,version:"v1"}]}))).toBe(false);
  expect(isCurrentBulkPlan(base,plan({rows:[...base.rows,{id:uuidA,version:"v1"}]}))).toBe(false);
  expect(isCurrentBulkPlan(base,plan({rows:[...base.rows].reverse()}))).toBe(false);
 });
 it("PHASE1-BULK-PLAN-04 field boundaries cannot be forged by moving characters between fields",()=>{
  const a=bulkPlanFingerprint(plan({action:"CLOSE",revision:"r1"}));
  const b=bulkPlanFingerprint(plan({action:"CLOS",revision:"Er1"}));
  expect(a).not.toBe(b);
 });
 it("PHASE1-BULK-PLAN-05 the schema rejects empty, oversized, non-UUID and unknown-field plans",()=>{
  const ok={action:"CLOSE",scopeId:uuidA,revision:"r1",rows:[{id:uuidB,version:"v1"}]};
  expect(bulkPlanSchema.safeParse(ok).success).toBe(true);
  expect(bulkPlanSchema.safeParse({...ok,rows:[]}).success).toBe(false);
  expect(bulkPlanSchema.safeParse({...ok,rows:Array.from({length:201},()=>({id:uuidB,version:"v"}))}).success).toBe(false);
  expect(bulkPlanSchema.safeParse({...ok,rows:Array.from({length:200},()=>({id:uuidB,version:"v"}))}).success).toBe(true);
  expect(bulkPlanSchema.safeParse({...ok,scopeId:"not-a-uuid"}).success).toBe(false);
  expect(bulkPlanSchema.safeParse({...ok,action:""}).success).toBe(false);
  expect(bulkPlanSchema.safeParse({...ok,extra:1}).success).toBe(false);
  expect(bulkPlanSchema.safeParse({...ok,rows:[{id:uuidB,version:"v1",extra:true}]}).success).toBe(false);
 });
});

describe("PHASE1-INVITE bulk recruiter invite disposition",()=>{
 const lead=(over:Partial<TpoBulkInviteCandidate>={}):TpoBulkInviteCandidate=>({
  id:uuidA,name:"Acme HR",emailNorm:"hr@acme.example",companyRelationshipId:uuidB,
  recruiterUserId:null,unsubscribedAt:null,manualStage:"NEW",...over,
 });
 it("PHASE1-INVITE-01 an invitable lead has no skip reason",()=>{
  expect(bulkInviteDisposition(lead())).toBeNull();
 });
 it("PHASE1-INVITE-02 each blocker maps to its legacy reason",()=>{
  expect(bulkInviteDisposition(lead({recruiterUserId:uuidC}))).toBe("Already joined");
  expect(bulkInviteDisposition(lead({unsubscribedAt:"2026-01-01T00:00:00Z"}))).toBe("Asked not to be contacted");
  expect(bulkInviteDisposition(lead({emailNorm:null}))).toBe("No email on file");
  expect(bulkInviteDisposition(lead({emailNorm:""}))).toBe("No email on file");
  expect(bulkInviteDisposition(lead({companyRelationshipId:null}))).toBe("Company link missing");
 });
 it("PHASE1-INVITE-03 blockers are reported in priority order: joined, unsubscribed, no email, no company",()=>{
  const all=lead({recruiterUserId:uuidC,unsubscribedAt:"2026-01-01T00:00:00Z",emailNorm:null,companyRelationshipId:null});
  expect(bulkInviteDisposition(all)).toBe("Already joined");
  expect(bulkInviteDisposition({...all,recruiterUserId:null})).toBe("Asked not to be contacted");
  expect(bulkInviteDisposition({...all,recruiterUserId:null,unsubscribedAt:null})).toBe("No email on file");
  expect(bulkInviteDisposition({...all,recruiterUserId:null,unsubscribedAt:null,emailNorm:"a@b.example"})).toBe("Company link missing");
 });
 it("PHASE1-INVITE-04 the preview keeps every row and attaches its own skip reason without mutating input",()=>{
  const rows=[lead(),lead({id:uuidB,emailNorm:null}),lead({id:uuidC,recruiterUserId:uuidA})];
  const snapshot=JSON.stringify(rows);
  const preview=previewTpoBulkInvites(rows);
  expect(preview.map(r=>[r.id,r.skipReason])).toEqual([[uuidA,null],[uuidB,"No email on file"],[uuidC,"Already joined"]]);
  expect(JSON.stringify(rows)).toBe(snapshot);
  expect(previewTpoBulkInvites([])).toEqual([]);
 });
});
