import {describe,expect,it} from "vitest";
import {
 TPO_DRIVE_CANONICAL_TRANSITIONS,canTransitionTpoDrive,canTransitionPlacementJobStatus,
 legacyRecruiterRequestTransitions,canTransitionLegacyRecruiterRequest,
 evaluateTpoDriveLifecycle,tpoDriveLifecycleSchema,tpoDriveReadinessMessage,
 type CanonicalTpoDriveStatus,type LegacyRecruiterRequestStatus,type TpoDriveReadinessFacts,
} from "@/modules/placements/tpo-drive-lifecycle-model";

const STATUSES=["DRAFT","PUBLISHED","CLOSED","CANCELLED","ARCHIVED"] as const;
const EXPECTED:Record<string,string[]>={
 DRAFT:["PUBLISHED","CANCELLED","ARCHIVED"],
 PUBLISHED:["CLOSED","CANCELLED"],
 CLOSED:["ARCHIVED"],
 CANCELLED:["ARCHIVED"],
 ARCHIVED:[],
};
const ready:TpoDriveReadinessFacts={
 jobStatus:"DRAFT",seasonActive:true,companyActive:true,roleCount:1,evaluativeRoundCount:1,
 policyPersisted:true,deadlineValid:true,deadlinePresent:true,payPresent:true,
 externalUrlPresent:true,appliedResultCount:0,acceptedOfferCount:0,
};

describe("PHASE1-STATE-DRIVE canonical placement drive status graph",()=>{
 it("PHASE1-STATE-DRIVE-01 defines exactly the documented graph for every stored status",()=>{
  expect(Object.keys(TPO_DRIVE_CANONICAL_TRANSITIONS).sort()).toEqual([...STATUSES].sort());
  for(const from of STATUSES)
   expect([...TPO_DRIVE_CANONICAL_TRANSITIONS[from]].sort()).toEqual([...EXPECTED[from]!].sort());
 });

 it("PHASE1-STATE-DRIVE-02 allows a transition if and only if it is in the table (full 5x5 matrix)",()=>{
  for(const from of STATUSES)for(const to of STATUSES)
   expect(canTransitionTpoDrive(from,to),`${from} -> ${to}`).toBe(EXPECTED[from]!.includes(to));
 });

 it("PHASE1-STATE-DRIVE-03 never allows a self transition and keeps ARCHIVED terminal",()=>{
  for(const s of STATUSES)expect(canTransitionTpoDrive(s,s),s).toBe(false);
  for(const to of STATUSES)expect(canTransitionTpoDrive("ARCHIVED",to)).toBe(false);
 });

 it("PHASE1-STATE-DRIVE-04 forbids every backward or skipping move an operator could attempt",()=>{
  const forbidden:[CanonicalTpoDriveStatus,CanonicalTpoDriveStatus][]=[
   ["PUBLISHED","DRAFT"],["CLOSED","PUBLISHED"],["CLOSED","DRAFT"],["CLOSED","CANCELLED"],
   ["CANCELLED","PUBLISHED"],["CANCELLED","DRAFT"],["CANCELLED","CLOSED"],
   ["PUBLISHED","ARCHIVED"],["ARCHIVED","DRAFT"],["ARCHIVED","PUBLISHED"],["DRAFT","CLOSED"],
  ];
  for(const [from,to] of forbidden)expect(canTransitionTpoDrive(from,to),`${from} -> ${to}`).toBe(false);
 });

 it("PHASE1-STATE-DRIVE-05 every destination in the table is itself a known status (no dangling states)",()=>{
  for(const from of STATUSES)for(const to of TPO_DRIVE_CANONICAL_TRANSITIONS[from])
   expect(STATUSES as readonly string[]).toContain(to);
 });

 it("PHASE1-STATE-DRIVE-06 every non-terminal status can eventually reach ARCHIVED",()=>{
  const reach=(from:string,seen=new Set<string>()):boolean=>{
   if(from==="ARCHIVED")return true;
   if(seen.has(from))return false;
   seen.add(from);
   return (TPO_DRIVE_CANONICAL_TRANSITIONS[from as CanonicalTpoDriveStatus] as readonly string[])
    .some(next=>reach(next,seen));
  };
  for(const s of STATUSES)expect(reach(s),s).toBe(true);
 });

 it("PHASE1-STATE-DRIVE-07 string-safe checker rejects unknown, prototype and mixed-case statuses",()=>{
  for(const bad of ["","draft","Published","DRAFT ","REQUEST","ACTIVE","__proto__","constructor","toString","hasOwnProperty","null","undefined"])
   expect(canTransitionPlacementJobStatus(bad,"PUBLISHED"),`from ${JSON.stringify(bad)}`).toBe(false);
  for(const bad of ["","published","__proto__","constructor","toString"])
   expect(canTransitionPlacementJobStatus("DRAFT",bad),`to ${JSON.stringify(bad)}`).toBe(false);
  expect(canTransitionPlacementJobStatus("DRAFT","PUBLISHED")).toBe(true);
  expect(canTransitionPlacementJobStatus("PUBLISHED","CLOSED")).toBe(true);
 });
});

describe("PHASE1-STATE-REQUEST legacy recruiter drive request graph",()=>{
 const STATES=["REQUEST","SENT_BACK","DRAFT","REJECTED","CANCELLED"] as const;
 const EXPECT_REQ:Record<string,string[]>={
  REQUEST:["DRAFT","SENT_BACK","REJECTED","CANCELLED"],
  SENT_BACK:["REQUEST","CANCELLED"],
  DRAFT:[],REJECTED:[],CANCELLED:[],
 };

 it("PHASE1-STATE-REQUEST-01 allows a transition if and only if documented (full 5x5 matrix)",()=>{
  for(const from of STATES)for(const to of STATES)
   expect(canTransitionLegacyRecruiterRequest(from as LegacyRecruiterRequestStatus,to as LegacyRecruiterRequestStatus),`${from} -> ${to}`)
    .toBe(EXPECT_REQ[from]!.includes(to));
 });

 it("PHASE1-STATE-REQUEST-02 DRAFT, REJECTED and CANCELLED are terminal for requests",()=>{
  for(const from of ["DRAFT","REJECTED","CANCELLED"] as const)
   expect(legacyRecruiterRequestTransitions[from]).toEqual([]);
 });

 it("PHASE1-STATE-REQUEST-03 approving a request creates a draft, never a live job",()=>{
  expect(canTransitionLegacyRecruiterRequest("REQUEST","DRAFT")).toBe(true);
  expect(Object.keys(legacyRecruiterRequestTransitions)).not.toContain("PUBLISHED");
  expect((legacyRecruiterRequestTransitions.REQUEST as readonly string[])).not.toContain("PUBLISHED");
 });

 it("PHASE1-STATE-REQUEST-04 a sent-back request can only return to REQUEST or be cancelled",()=>{
  expect(canTransitionLegacyRecruiterRequest("SENT_BACK","REJECTED")).toBe(false);
  expect(canTransitionLegacyRecruiterRequest("SENT_BACK","DRAFT")).toBe(false);
  expect(canTransitionLegacyRecruiterRequest("SENT_BACK","REQUEST")).toBe(true);
 });
});

describe("PHASE1-STATE-LIFECYCLE evaluateTpoDriveLifecycle preflight",()=>{
 it("PHASE1-STATE-LIFECYCLE-01 a fully ready draft can be published and a published drive can be closed",()=>{
  expect(evaluateTpoDriveLifecycle("PUBLISH",ready)).toEqual({allowed:true,blockers:[]});
  expect(evaluateTpoDriveLifecycle("CLOSE",{...ready,jobStatus:"PUBLISHED"})).toEqual({allowed:true,blockers:[]});
 });

 it("PHASE1-STATE-LIFECYCLE-02 stale status blocks every action from every wrong source status",()=>{
  const source={PUBLISH:"DRAFT",CLOSE:"PUBLISHED",REOPEN:"CLOSED"} as const;
  for(const action of ["PUBLISH","CLOSE","REOPEN"] as const)
   for(const status of [...STATUSES,"REQUEST","ACTIVE",""])
    if(status!==source[action])
     expect(evaluateTpoDriveLifecycle(action,{...ready,jobStatus:status}).blockers,`${action} from ${status}`)
      .toContain("STALE_JOB_STATUS");
 });

 it("PHASE1-STATE-LIFECYCLE-03 REOPEN of a closed drive is always blocked as terminal",()=>{
  const result=evaluateTpoDriveLifecycle("REOPEN",{...ready,jobStatus:"CLOSED"});
  expect(result.allowed).toBe(false);
  expect(result.blockers.filter(b=>b==="CLOSED_DRIVE_TERMINAL")).toHaveLength(1);
 });

 it("PHASE1-STATE-LIFECYCLE-04 reopen also reports applied results and accepted offers",()=>{
  const r=evaluateTpoDriveLifecycle("REOPEN",{...ready,jobStatus:"CLOSED",appliedResultCount:2,acceptedOfferCount:1});
  expect(r.blockers).toEqual(expect.arrayContaining(["CLOSED_DRIVE_TERMINAL","APPLIED_RESULTS_EXIST","ACCEPTED_OFFERS_EXIST"]));
 });

 it("PHASE1-STATE-LIFECYCLE-05 each missing publish prerequisite is reported by its own blocker",()=>{
  const cases:[Partial<TpoDriveReadinessFacts>,string][]=[
   [{seasonActive:false},"SEASON_NOT_ACTIVE"],[{companyActive:false},"COMPANY_NOT_ACTIVE"],
   [{roleCount:0},"NO_ACTIVE_ROLE"],[{evaluativeRoundCount:0},"NO_EVALUATIVE_ROUND"],
   [{policyPersisted:false},"ELIGIBILITY_POLICY_NOT_PERSISTED"],
   [{deadlinePresent:false},"APPLICATION_DEADLINE_MISSING"],[{payPresent:false},"PACKAGE_MISSING"],
   [{externalUrlPresent:false},"EXTERNAL_APPLICATION_LINK_MISSING"],
   [{deadlineValid:false},"APPLICATION_DEADLINE_PASSED"],
  ];
  for(const [patch,code] of cases){
   const r=evaluateTpoDriveLifecycle("PUBLISH",{...ready,...patch});
   expect(r.allowed,code).toBe(false);
   expect(r.blockers,code).toContain(code);
  }
 });

 it("PHASE1-STATE-LIFECYCLE-06 closeout stays possible after the season ends or the company is deactivated",()=>{
  const r=evaluateTpoDriveLifecycle("CLOSE",{...ready,jobStatus:"PUBLISHED",seasonActive:false,companyActive:false,roleCount:0,deadlineValid:false});
  expect(r).toEqual({allowed:true,blockers:[]});
 });

 it("PHASE1-STATE-LIFECYCLE-07 every blocker code has a specific operator message and unknown codes fall back safely",()=>{
  const codes=["STALE_JOB_STATUS","CLOSED_DRIVE_TERMINAL","SEASON_NOT_ACTIVE","COMPANY_NOT_ACTIVE","NO_ACTIVE_ROLE",
   "NO_EVALUATIVE_ROUND","ELIGIBILITY_POLICY_NOT_PERSISTED","APPLICATION_DEADLINE_MISSING","PACKAGE_MISSING",
   "EXTERNAL_APPLICATION_LINK_MISSING","APPLICATION_DEADLINE_PASSED","IMPORTANT_DATES_INVALID",
   "APPLIED_RESULTS_EXIST","ACCEPTED_OFFERS_EXIST"];
  const fallback=tpoDriveReadinessMessage("__NOT_A_CODE__");
  expect(fallback).toBe("The drive is not ready for this action. Refresh and review the setup.");
  for(const c of codes)expect(tpoDriveReadinessMessage(c),c).not.toBe(fallback);
  expect(tpoDriveReadinessMessage("constructor")).toBe(fallback);
 });
});

describe("PHASE1-STATE-LIFECYCLE-SCHEMA lifecycle command validation",()=>{
 const ok={action:"PUBLISH",expectedStatus:"DRAFT",confirmed:true,reason:"Ready to publish now"};

 it("PHASE1-STATE-LIFECYCLE-SCHEMA-01 accepts a confirmed command with a 10+ char reason",()=>{
  expect(tpoDriveLifecycleSchema.safeParse(ok).success).toBe(true);
 });

 it("PHASE1-STATE-LIFECYCLE-SCHEMA-02 rejects unconfirmed, short or oversized reasons and unknown fields",()=>{
  expect(tpoDriveLifecycleSchema.safeParse({...ok,confirmed:false}).success).toBe(false);
  expect(tpoDriveLifecycleSchema.safeParse({...ok,confirmed:"true"}).success).toBe(false);
  expect(tpoDriveLifecycleSchema.safeParse({...ok,reason:"too short"}).success).toBe(false);
  expect(tpoDriveLifecycleSchema.safeParse({...ok,reason:"   padded   "}).success).toBe(false);
  expect(tpoDriveLifecycleSchema.safeParse({...ok,reason:"x".repeat(1001)}).success).toBe(false);
  expect(tpoDriveLifecycleSchema.safeParse({...ok,reason:"x".repeat(1000)}).success).toBe(true);
  expect(tpoDriveLifecycleSchema.safeParse({...ok,collegeId:"other-college"}).success).toBe(false);
 });

 it("PHASE1-STATE-LIFECYCLE-SCHEMA-03 rejects actions and expected statuses outside the lifecycle",()=>{
  for(const action of ["ARCHIVE","CANCEL","DELETE","publish",""])
   expect(tpoDriveLifecycleSchema.safeParse({...ok,action}).success,action).toBe(false);
  for(const expectedStatus of ["CANCELLED","ARCHIVED","REQUEST","draft"])
   expect(tpoDriveLifecycleSchema.safeParse({...ok,expectedStatus}).success,expectedStatus).toBe(false);
  expect(tpoDriveLifecycleSchema.parse(ok).notifyByEmail).toBe(false);
 });
});
