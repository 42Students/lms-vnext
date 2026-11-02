import {describe,expect,it} from "vitest";
import {
 recruiterGrantValidUntil,recruiterGrantEffectiveAt,classifyLegacyRecruiterGrant,
 legacyRecruiterAccessMonthsToValidUntil,legacyRecruiterGrantActivationPlan,
 type LegacyRecruiterGrantMigration,
} from "@/modules/placements/recruiter-grant-expiry-policy";
import {
 collegeDriveCloseAction,collegeDriveReopenAction,legacyFlagsForCollegeDrive,
 collegeDriveStatusFromLegacyFlags,collegeDriveLegacyTransition,type CollegeLegacyDriveStatus,
} from "@/modules/placements/college-legacy-drive-settings-model";
import {canTransitionTpoDrive} from "@/modules/placements/tpo-drive-lifecycle-model";

const iso=(d:Date)=>d.toISOString();

describe("PHASE1-GRANT recruiter grant validity end date",()=>{
 it("PHASE1-GRANT-01 adds whole calendar months and preserves the time of day to the millisecond",()=>{
  expect(iso(recruiterGrantValidUntil(new Date("2026-03-15T08:30:15.123Z"),12))).toBe("2027-03-15T08:30:15.123Z");
  expect(iso(recruiterGrantValidUntil(new Date("2026-01-01T00:00:00.000Z"),60))).toBe("2031-01-01T00:00:00.000Z");
  expect(iso(recruiterGrantValidUntil(new Date("2026-01-15T10:00:00.000Z"),1))).toBe("2026-02-15T10:00:00.000Z");
 });
 it("PHASE1-GRANT-02 clamps to the last day of a shorter target month, including leap years and year rollover",()=>{
  expect(iso(recruiterGrantValidUntil(new Date("2026-01-31T10:00:00.000Z"),1))).toBe("2026-02-28T10:00:00.000Z");
  expect(iso(recruiterGrantValidUntil(new Date("2024-01-31T10:00:00.000Z"),1))).toBe("2024-02-29T10:00:00.000Z");
  expect(iso(recruiterGrantValidUntil(new Date("2026-11-30T10:00:00.000Z"),3))).toBe("2027-02-28T10:00:00.000Z");
  expect(iso(recruiterGrantValidUntil(new Date("2026-12-31T23:59:59.999Z"),2))).toBe("2027-02-28T23:59:59.999Z");
  expect(iso(recruiterGrantValidUntil(new Date("2026-05-31T00:00:00.000Z"),1))).toBe("2026-06-30T00:00:00.000Z");
 });
 it("PHASE1-GRANT-03 rejects durations outside 1..60 whole months and invalid grant dates",()=>{
  const at=new Date("2026-01-01T00:00:00Z");
  for(const bad of [0,-1,61,1.5,Number.NaN,Number.POSITIVE_INFINITY])
   expect(()=>recruiterGrantValidUntil(at,bad),String(bad)).toThrow("INVALID_GRANT_DURATION");
  expect(()=>recruiterGrantValidUntil(new Date("not a date"),3)).toThrow("INVALID_GRANT_DURATION");
  expect(()=>recruiterGrantValidUntil(at,1)).not.toThrow();
  expect(()=>recruiterGrantValidUntil(at,60)).not.toThrow();
 });
 it("PHASE1-GRANT-04 never mutates the grant date it was given",()=>{
  const at=new Date("2026-01-31T10:00:00.000Z");
  recruiterGrantValidUntil(at,1);
  expect(iso(at)).toBe("2026-01-31T10:00:00.000Z");
 });
});

describe("PHASE1-GRANT-AUTH recruiterGrantEffectiveAt fails closed",()=>{
 const now=new Date("2026-06-01T12:00:00.000Z");
 const grant=(over:Partial<{status:string;validUntil:Date|null;verificationStatus:string;capabilities:readonly string[]}>={})=>({
  status:"ACTIVE",validUntil:new Date(now.getTime()+1),verificationStatus:"VERIFIED",capabilities:["VIEW_APPLICANTS"] as readonly string[],...over,
 });
 it("PHASE1-GRANT-AUTH-01 an active, verified, unexpired grant is effective",()=>{
  expect(recruiterGrantEffectiveAt(grant(),now)).toBe(true);
  expect(recruiterGrantEffectiveAt(grant(),now,"VIEW_APPLICANTS")).toBe(true);
 });
 it("PHASE1-GRANT-AUTH-02 the expiry instant itself is already expired (strictly later required)",()=>{
  expect(recruiterGrantEffectiveAt(grant({validUntil:new Date(now.getTime())}),now)).toBe(false);
  expect(recruiterGrantEffectiveAt(grant({validUntil:new Date(now.getTime()-1)}),now)).toBe(false);
 });
 it("PHASE1-GRANT-AUTH-03 status, verification or a missing or invalid expiry each deny access",()=>{
  for(const status of ["REVOKED","SUSPENDED","PENDING","active",""])
   expect(recruiterGrantEffectiveAt(grant({status}),now),status).toBe(false);
  for(const verificationStatus of ["PENDING","REJECTED","verified",""])
   expect(recruiterGrantEffectiveAt(grant({verificationStatus}),now),verificationStatus).toBe(false);
  expect(recruiterGrantEffectiveAt(grant({validUntil:null}),now)).toBe(false);
  expect(recruiterGrantEffectiveAt(grant({validUntil:new Date("nope")}),now)).toBe(false);
  expect(recruiterGrantEffectiveAt(grant(),new Date("nope"))).toBe(false);
 });
 it("PHASE1-GRANT-AUTH-04 a needed capability must be present exactly",()=>{
  expect(recruiterGrantEffectiveAt(grant(),now,"EXPORT")).toBe(false);
  expect(recruiterGrantEffectiveAt(grant({capabilities:[]}),now,"VIEW_APPLICANTS")).toBe(false);
  expect(recruiterGrantEffectiveAt(grant({capabilities:["view_applicants"]}),now,"VIEW_APPLICANTS")).toBe(false);
  expect(recruiterGrantEffectiveAt(grant({capabilities:[]}),now)).toBe(true);
 });
});

describe("PHASE1-GRANT-LEGACY legacy recruiter grant migration classification",()=>{
 const now=new Date("2026-06-01T12:00:00.000Z");
 const legacy=(over:Partial<LegacyRecruiterGrantMigration>={}):LegacyRecruiterGrantMigration=>({
  legacyStatus:"ACTIVE",deleted:false,legacyValidUntil:new Date(now.getTime()+86_400_000),recruiterActive:true,
  collegeActive:true,capability:"VIEW",capabilities:["VIEW"],verificationStatus:"VERIFIED",...over,
 });
 it("PHASE1-GRANT-LEGACY-01 a fully valid legacy grant is READY",()=>{
  expect(classifyLegacyRecruiterGrant(legacy(),now)).toBe("READY");
 });
 it("PHASE1-GRANT-LEGACY-02 inactive, deleted, deactivated parties or a missing capability are INACTIVE",()=>{
  for(const over of [{legacyStatus:"REVOKED"},{deleted:true},{recruiterActive:false},{collegeActive:false},{capabilities:["EXPORT"]}])
   expect(classifyLegacyRecruiterGrant(legacy(over),now),JSON.stringify(over)).toBe("INACTIVE");
 });
 it("PHASE1-GRANT-LEGACY-03 an open-ended legacy grant requires a reviewed expiry and is never READY",()=>{
  expect(classifyLegacyRecruiterGrant(legacy({legacyValidUntil:null}),now)).toBe("REQUIRES_EXPIRY");
 });
 it("PHASE1-GRANT-LEGACY-04 expired (including exactly now or an invalid date) beats the verification check",()=>{
  expect(classifyLegacyRecruiterGrant(legacy({legacyValidUntil:new Date(now.getTime()-1)}),now)).toBe("EXPIRED");
  expect(classifyLegacyRecruiterGrant(legacy({legacyValidUntil:new Date(now.getTime())}),now)).toBe("EXPIRED");
  expect(classifyLegacyRecruiterGrant(legacy({legacyValidUntil:new Date("nope")}),now)).toBe("EXPIRED");
  expect(classifyLegacyRecruiterGrant(legacy(),new Date("nope"))).toBe("EXPIRED");
  expect(classifyLegacyRecruiterGrant(legacy({legacyValidUntil:new Date(now.getTime()-1),verificationStatus:null}),now)).toBe("EXPIRED");
 });
 it("PHASE1-GRANT-LEGACY-05 a current but unverified grant requires verification",()=>{
  for(const verificationStatus of [null,"PENDING","REJECTED"])
   expect(classifyLegacyRecruiterGrant(legacy({verificationStatus}),now),String(verificationStatus)).toBe("REQUIRES_VERIFICATION");
 });
 it("PHASE1-GRANT-LEGACY-06 inactive wins over every later state",()=>{
  expect(classifyLegacyRecruiterGrant(legacy({legacyStatus:"REVOKED",legacyValidUntil:null,verificationStatus:null}),now)).toBe("INACTIVE");
 });
 it("PHASE1-GRANT-LEGACY-07 legacy access months of 0 stays open-ended (null) and never invents an expiry",()=>{
  const at=new Date("2026-01-31T10:00:00.000Z");
  expect(legacyRecruiterAccessMonthsToValidUntil(at,0)).toBeNull();
  expect(iso(legacyRecruiterAccessMonthsToValidUntil(at,1)!)).toBe("2026-02-28T10:00:00.000Z");
  expect(()=>legacyRecruiterAccessMonthsToValidUntil(at,-3)).toThrow("INVALID_GRANT_DURATION");
 });
 it("PHASE1-GRANT-LEGACY-08 the activation plan never activates open-ended, unverified, inactive or expired grants",()=>{
  const base={legacyCollegeId:7,legacyRecruiterId:9,collegeId:"11111111-1111-4111-8111-111111111111",
   relationshipId:"22222222-2222-4222-8222-222222222222",expiresAt:new Date(Date.now()+86_400_000),verified:true,active:true};
  expect(legacyRecruiterGrantActivationPlan(base)).toMatchObject({activationAllowed:true,indefiniteLegacyGrant:false,revokedOrSuspended:false});
  expect(legacyRecruiterGrantActivationPlan({...base,expiresAt:null})).toMatchObject({activationAllowed:false,indefiniteLegacyGrant:true,requiresFiniteExpiryReview:true});
  expect(legacyRecruiterGrantActivationPlan({...base,verified:false}).activationAllowed).toBe(false);
  expect(legacyRecruiterGrantActivationPlan({...base,active:false})).toMatchObject({activationAllowed:false,revokedOrSuspended:true});
  expect(legacyRecruiterGrantActivationPlan({...base,expiresAt:new Date(Date.now()-1000)}).activationAllowed).toBe(false);
 });
 it("PHASE1-GRANT-LEGACY-09 the activation plan rejects invalid legacy keys and unmapped college or relationship ids",()=>{
  const base={legacyCollegeId:7,legacyRecruiterId:9,collegeId:"11111111-1111-4111-8111-111111111111",
   relationshipId:"22222222-2222-4222-8222-222222222222",expiresAt:null,verified:true,active:true};
  for(const bad of [0,-1,1.5,Number.NaN,Number.MAX_SAFE_INTEGER+2]){
   expect(()=>legacyRecruiterGrantActivationPlan({...base,legacyCollegeId:bad}),`college ${bad}`).toThrow("Invalid legacy recruiter grant keys");
   expect(()=>legacyRecruiterGrantActivationPlan({...base,legacyRecruiterId:bad}),`recruiter ${bad}`).toThrow("Invalid legacy recruiter grant keys");
  }
  for(const over of [{collegeId:null},{relationshipId:null},{collegeId:"not-a-uuid"},{relationshipId:"123"}])
   expect(()=>legacyRecruiterGrantActivationPlan({...base,...over}),JSON.stringify(over)).toThrow("Unmapped recruiter/company relationship grant");
 });
});

describe("PHASE1-DRIVEFLAGS legacy isDraft/isActive boolean adapter",()=>{
 const D="DRAFT",P="PUBLISHED",C="CLOSED",A="ARCHIVED";
 const STATUSES:CollegeLegacyDriveStatus[]=[D,P,C,A];
 // Rows are [isDraft,isActive]; columns are the current status DRAFT, PUBLISHED, CLOSED, ARCHIVED.
 const TARGET:Record<string,(CollegeLegacyDriveStatus|null)[]>={
  "false,false":[null,C,C,null],
  "true,false":[D,null,null,null],
  "false,true":[P,P,P,null],
  "true,true":[null,null,null,null],
 };
 const ACTION:Record<string,(string|null)[]>={
  "false,false":[null,"CLOSE","NO_CHANGE",null],
  "true,false":["NO_CHANGE",null,null,null],
  "false,true":["PUBLISH","NO_CHANGE","REOPEN",null],
  "true,true":[null,null,null,null],
 };

 it("PHASE1-DRIVEFLAGS-01 maps every flag pair and current status to the documented target (full matrix)",()=>{
  for(const [key,row] of Object.entries(TARGET)){
   const [isDraft,isActive]=key.split(",").map(v=>v==="true") as [boolean,boolean];
   STATUSES.forEach((current,i)=>expect(collegeDriveStatusFromLegacyFlags({isDraft,isActive},current),`${key} @ ${current}`).toBe(row[i]));
  }
 });
 it("PHASE1-DRIVEFLAGS-02 maps every flag pair and current status to the safe lifecycle action (full matrix)",()=>{
  for(const [key,row] of Object.entries(ACTION)){
   const [isDraft,isActive]=key.split(",").map(v=>v==="true") as [boolean,boolean];
   STATUSES.forEach((current,i)=>expect(collegeDriveLegacyTransition(current,{isDraft,isActive}),`${key} @ ${current}`).toBe(row[i]));
  }
 });
 it("PHASE1-DRIVEFLAGS-03 an archived drive can never be changed through boolean flags",()=>{
  for(const isDraft of [false,true])for(const isActive of [false,true]){
   expect(collegeDriveStatusFromLegacyFlags({isDraft,isActive},A)).toBeNull();
   expect(collegeDriveLegacyTransition(A,{isDraft,isActive})).toBeNull();
  }
 });
 it("PHASE1-DRIVEFLAGS-04 a closed or published drive can never be taken back to draft by a boolean",()=>{
  for(const current of [P,C]){
   expect(collegeDriveStatusFromLegacyFlags({isDraft:true,isActive:false},current)).toBeNull();
   expect(collegeDriveLegacyTransition(current,{isDraft:true,isActive:false})).toBeNull();
  }
 });
 it("PHASE1-DRIVEFLAGS-05 flags projected from a status are mutually exclusive and round-trip to NO_CHANGE",()=>{
  for(const s of STATUSES){
   const flags=legacyFlagsForCollegeDrive(s);
   expect(flags.isDraft&&flags.isActive).toBe(false);
   if(s===D||s===P)expect(collegeDriveLegacyTransition(s,flags)).toBe("NO_CHANGE");
  }
  expect(legacyFlagsForCollegeDrive(D)).toEqual({isDraft:true,isActive:false});
  expect(legacyFlagsForCollegeDrive(P)).toEqual({isDraft:false,isActive:true});
  expect(legacyFlagsForCollegeDrive(C)).toEqual({isDraft:false,isActive:false});
  expect(legacyFlagsForCollegeDrive(A)).toEqual({isDraft:false,isActive:false});
 });
 it("PHASE1-DRIVEFLAGS-06 pins the college REOPEN path as the one legacy action the canonical drive graph forbids",()=>{
  // PUBLISH and CLOSE agree with the canonical TPO graph. REOPEN (CLOSED -> PUBLISHED) is a deliberate
  // college-admin legacy operation that the canonical TPO table treats as terminal; if either side changes,
  // this test forces the divergence to be re-decided on purpose.
  expect(canTransitionTpoDrive("DRAFT","PUBLISHED")).toBe(true);
  expect(canTransitionTpoDrive("PUBLISHED","CLOSED")).toBe(true);
  expect(canTransitionTpoDrive("CLOSED","PUBLISHED")).toBe(false);
  expect(collegeDriveLegacyTransition("CLOSED",{isDraft:false,isActive:true})).toBe("REOPEN");
 });
 it("PHASE1-DRIVEFLAGS-07 close and reopen offers use the exact legacy labels and confirmations and appear only from the right status",()=>{
  expect(collegeDriveCloseAction(P)).toEqual({action:"CLOSE",label:"Close drive",confirmation:"Are you sure you want to close this drive?"});
  expect(collegeDriveReopenAction(C)).toEqual({action:"REOPEN",label:"Open drive",confirmation:"Reopen this drive? Previously withdrawn offers will not be restored."});
  for(const s of [D,C,A])expect(collegeDriveCloseAction(s),s).toBeNull();
  for(const s of [D,P,A])expect(collegeDriveReopenAction(s),s).toBeNull();
 });
});
