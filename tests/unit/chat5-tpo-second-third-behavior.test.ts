import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 tpoRoundResultViewSchema,projectTpoRoundResultTable,filterTpoRoundResultRows,
 type RoundResultEntry,
} from "@/modules/placements/tpo-round-result-table-model";
import {
 offerRegisterQuery,projectOfferRegister,tpoDriveOfferRegisterCsv,offerExpiryIndicator,
 type OfferRegisterFact,
} from "@/modules/placements/tpo-drive-offer-register-model";
import {tpoOfferEvidenceQuery,projectOfferEvidence} from "@/modules/placements/tpo-offer-evidence-model";

const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const uuid="11111111-1111-4111-8111-111111111111";
const job="/tpo/placements/jobs/[jobId]/";
const page=(fragment:string)=>src("src/app/(authenticated)"+job+fragment+"/page.tsx");
const at=new Date("2099-10-18T10:00:00Z");

describe("chat-5 TPO second-third: direct route authorization, negative and empty states",()=>{
 const routes=[
  ["selections","getTpoSelectionWorkspace","TpoDriveSelectionManager"],
  ["waitlist","getTpoWaitlistPreview","TpoWaitlistPromotionControl"],
  ["offers","getTpoDriveOfferRegister","No offers match this filter."],
  ["offers/[offerId]","getTpoOfferEvidence","No persisted status or joining history events were found"],
  ["joining","getTpoJoiningTracker","No currently accepted offers are recorded"],
  ["rounds/[roundId]/results","getTpoRoundResultTable","No eligible shortlisted submitted applicants match"],
  ["closeout","getTpoDriveCloseout","No applications are persisted for this drive."],
  ["applications-export","getTpoDriveApplicationsExport","No persisted applications match these filters."],
 ] as const;
 for(const [route,fetcher,empty] of routes){
  it("TPO-2ND-PAGE-"+route.replace(/[^a-z]+/g,"-")+"-01 authenticates and handles missing/empty evidence",()=>{
   const code=page(route);
   expect(code).toContain("getCurrentRequestContext()");
   expect(code).toMatch(/hasMembershipRole\(context,\s*"TPO"\)/);
   expect(code).toContain('redirect("/dashboard")');
   expect(code).toContain(fetcher);
   expect(code).toContain("notFound()");
   expect(code).toContain(empty);
   expect(code).not.toContain("window.alert(");
   expect(code).not.toContain("window.prompt(");
  });
 }
 it("TPO-2ND-PAGE-lifecycle-02 keeps the active scoped permission in the drive list and exposes zero/error states",()=>{
  const code=src("src/app/(authenticated)/tpo/placements/lifecycle/page.tsx");
  expect(code).toContain('can(context,"placements.manage",{collegeId:context.membership.collegeId})');
  expect(code).toContain("redirect(");
  expect(code).toContain('<EmptyState');
  expect(code).toContain('title="No requests"');
  expect(code).toContain('Recruiter access ended. Finish this drive yourself.');
  expect(code).toContain("data.totalPages");
  expect(code).toContain("data.page");
 });
 it("TPO-2ND-PAGE-recorded-outside-02 denies unauthorized reads and shows truthful empty evidence",()=>{
  const code=src("src/app/(authenticated)/tpo/placements/recorded-outside/page.tsx");
  expect(code).toContain('hasMembershipRole(context,"TPO")');
  expect(code).toContain('redirect("/dashboard")');
  expect(code).toContain("listTpoOutsideDriveRecords(context)");
  expect(code).toContain("No outside-platform drives have been recorded yet.");
 });
});

describe("chat-5 TPO second-third: behavioural round and offer reporting",()=>{
 const entries:RoundResultEntry[]=[
  {applicationId:"1",student:"Alice",role:"Developer",applicationStatus:"SUBMITTED",screeningStatus:"SHORTLISTED",resultId:"r1",resultStatus:"STAGED",outcome:"PASS"},
  {applicationId:"2",student:"Bob",role:"Developer",applicationStatus:"SUBMITTED",screeningStatus:"SHORTLISTED",resultId:"r2",resultStatus:"APPLIED",outcome:"PASS"},
  {applicationId:"3",student:"Carol",role:"Developer",applicationStatus:"WITHDRAWN",screeningStatus:"SHORTLISTED",resultId:null,resultStatus:null,outcome:null},
  {applicationId:"4",student:"Dinesh",role:"Analyst",applicationStatus:"SUBMITTED",screeningStatus:"PENDING",resultId:null,resultStatus:null,outcome:null},
 ];
 it("PLACEMENTS-ROUND-VIEW-01 never stages rejected/withdrawn applicants or modifies applied results",()=>{
  const projected=projectTpoRoundResultTable(entries,{kind:"INTERVIEW",status:"COMPLETED",jobStatus:"PUBLISHED"});
  expect(projected.counts).toEqual({eligible:2,staged:1,applied:1,remaining:0});
  expect(projected.rows.map(row=>[row.student,row.editable])).toEqual([["Alice",true],["Bob",false]]);
  expect(projectTpoRoundResultTable(entries,{kind:"TALK",status:"COMPLETED",jobStatus:"PUBLISHED"}).rows.every(row=>!row.editable)).toBe(true);
  expect(projectTpoRoundResultTable(entries,{kind:"INTERVIEW",status:"CANCELLED",jobStatus:"PUBLISHED"}).rows.every(row=>!row.editable)).toBe(true);
  expect(projectTpoRoundResultTable(entries,{kind:"INTERVIEW",status:"COMPLETED",jobStatus:"CLOSED"}).rows.every(row=>!row.editable)).toBe(true);
 });
 it("PLACEMENTS-ROUND-VIEW-02 filters staged and applied state without drifting roster scope",()=>{
  const rows=projectTpoRoundResultTable(entries,{kind:"INTERVIEW",status:"COMPLETED",jobStatus:"PUBLISHED"}).rows;
  const staged=tpoRoundResultViewSchema.parse({q:" alice ",status:"STAGED"});
  expect(filterTpoRoundResultRows(rows,staged).map(row=>row.student)).toEqual(["Alice"]);
  expect(filterTpoRoundResultRows(rows,tpoRoundResultViewSchema.parse({status:"NOT_RECORDED"}))).toEqual([]);
  expect(tpoRoundResultViewSchema.safeParse({status:"SELECTED"}).success).toBe(false);
  expect(tpoRoundResultViewSchema.safeParse({q:"x".repeat(101)}).success).toBe(false);
  expect(tpoRoundResultViewSchema.safeParse({collegeId:uuid}).success).toBe(false);
 });
 const candidate={membershipId:uuid,displayName:"=2+2",email:"worker@example.test"};
 const offerFacts:OfferRegisterFact[]=[
  {offer:{id:"a",status:"ISSUED",kind:"OFFER",roleTitle:"Developer",annualCtcInr:500_000,issuedAt:at,respondedAt:null,expiresAt:new Date("2099-10-19T10:00:00Z")},joining:null,candidate},
  {offer:{id:"b",status:"ACCEPTED",kind:"OFFER",roleTitle:"Analyst",annualCtcInr:1_200_000,issuedAt:new Date("2099-10-16T10:00:00Z"),respondedAt:at},joining:{status:"JOINED"},candidate},
  {offer:{id:"c",status:"DECLINED",kind:"LOI",roleTitle:"Designer",annualCtcInr:null,issuedAt:new Date("2099-10-15T10:00:00Z"),respondedAt:at},joining:null,candidate},
 ];
 it("PLACEMENTS-OFFERS-VIEW-01 never counts issued/declined as accepted or infers joining",()=>{
  const result=projectOfferRegister(offerFacts,"ALL",1,"","ALL",at);
  expect(result.counts).toEqual({all:3,issued:1,accepted:1,declined:1,withdrawn:0,expired:0});
  expect(result.rows.find(row=>row.id==="a")).toMatchObject({joining:null,status:"ISSUED"});
  expect(result.rows.find(row=>row.id==="b")).toMatchObject({joining:"JOINED",status:"ACCEPTED"});
  expect(result.rows.find(row=>row.id==="c")).toMatchObject({joining:null,kind:"LOI"});
  expect(projectOfferRegister(offerFacts,"ALL",999,"","ALL",at).page).toBe(1);
 });
 it("PLACEMENTS-OFFERS-EXPIRED-05 filters persisted expired offers distinctly from issued-but-overdue offers",()=>{
  const expired:OfferRegisterFact={offer:{
    id:"expired-1",status:"EXPIRED",kind:"OFFER",roleTitle:"QA engineer",
    annualCtcInr:800_000,issuedAt:new Date("2099-10-01T10:00:00Z"),
    respondedAt:null,expiresAt:new Date("2099-10-10T10:00:00Z"),
  },joining:null,candidate};
  const all=[...offerFacts,expired];
  const parsed=offerRegisterQuery.parse({jobId:uuid,status:"EXPIRED"});
  const result=projectOfferRegister(all,parsed.status,1,"","ALL",at);
  expect(result.counts).toEqual({all:4,issued:1,accepted:1,declined:1,withdrawn:0,expired:1});
  expect(result.rows.map(row=>row.id)).toEqual(["expired-1"]);
  const csv=tpoDriveOfferRegisterCsv(all,parsed);
  expect(csv.totalMatching).toBe(1);
  expect(csv.csv).toContain("expired-1");
  expect(csv.csv).not.toContain('"a","');
  const pageSource=src("src/app/(authenticated)/tpo/placements/jobs/[jobId]/offers/page.tsx");
  expect(pageSource).toContain('["EXPIRED","Expired",data.counts.expired]');
  expect(offerRegisterQuery.safeParse({jobId:uuid,status:"CANCELLED"}).success).toBe(false);
 });
 it("PLACEMENTS-OFFERS-EXPIRY-04 distinguishes exact deadline, seven-day edge and invalid evidence",()=>{
  const expiry=new Date("2099-10-25T10:00:00.000Z");
  const justBefore=new Date("2099-10-18T10:00:00.000Z");
  expect(offerExpiryIndicator("ISSUED",expiry,justBefore)).toBe("DUE_SOON");
  expect(offerExpiryIndicator("ISSUED",expiry,new Date("2099-10-18T09:59:59.999Z"))).toBe("OPEN");
  expect(offerExpiryIndicator("ISSUED",expiry,expiry)).toBe("EXPIRED");
  expect(offerExpiryIndicator("ACCEPTED",expiry,expiry)).toBe("NOT_APPLICABLE");
  expect(offerExpiryIndicator("ISSUED",null,expiry)).toBe("UNKNOWN");
  expect(offerExpiryIndicator("ISSUED",new Date(Number.NaN),expiry)).toBe("UNKNOWN");
  expect(offerExpiryIndicator("ISSUED",expiry,new Date(Number.NaN))).toBe("UNKNOWN");
 });
 it("PLACEMENTS-OFFERS-FILTER-06 preserves unbounded searches when HTML sends blank LPA inputs",()=>{
  const empty=offerRegisterQuery.parse({
    jobId:uuid,status:"ISSUED",minCtcLpa:"",maxCtcLpa:"",
  });
  expect(empty.minCtcLpa).toBeUndefined();
  expect(empty.maxCtcLpa).toBeUndefined();
  expect(projectOfferRegister(offerFacts,empty.status,empty.page,empty.q,empty.joining,
    at,empty.kind,empty.expiry,empty.minCtcLpa,empty.maxCtcLpa).rows.map(row=>row.id))
    .toEqual(["a"]);
  for(const v of ["NaN","Infinity","-1","1001","a thousand"]){
    expect(offerRegisterQuery.safeParse({jobId:uuid,minCtcLpa:v}).success).toBe(false);
  }
  const zero=offerRegisterQuery.parse({jobId:uuid,minCtcLpa:"0"});
  expect(zero.minCtcLpa).toBe(0);
 });
 it("PLACEMENTS-OFFERS-VIEW-02 rejects malformed filters and shares identical filters between visible rows and CSV",()=>{
  expect(offerRegisterQuery.safeParse({jobId:uuid,status:"ALL",minCtcLpa:12,maxCtcLpa:6}).success).toBe(false);
  expect(offerRegisterQuery.safeParse({jobId:uuid,status:"NONSENSE"}).success).toBe(false);
  expect(offerRegisterQuery.safeParse({jobId:uuid,otherCollegeId:uuid}).success).toBe(false);
  const parsed=offerRegisterQuery.parse({jobId:uuid,status:"ACCEPTED",joining:"JOINED"});
  const view=projectOfferRegister(offerFacts,parsed.status,parsed.page,parsed.q,parsed.joining,at,parsed.kind,parsed.expiry);
  expect(view.rows.map(row=>row.id)).toEqual(["b"]);
  const csv=tpoDriveOfferRegisterCsv(offerFacts,parsed);
  expect(csv.totalMatching).toBe(1);
  expect(csv.csv).toContain('"b"');
  expect(csv.csv).not.toContain('"a","');
  expect(csv.csv).not.toContain('"c","');
  expect(csv.csv).toContain("\u0027=2+2");
 });
 it("PLACEMENTS-OFFER-EVIDENCE-01 rejects foreign or malformed route identity and orders persisted history only",()=>{
  expect(tpoOfferEvidenceQuery.safeParse({jobId:uuid,offerId:"../../foreign"}).success).toBe(false);
  expect(tpoOfferEvidenceQuery.safeParse({jobId:uuid,offerId:uuid,collegeId:uuid}).success).toBe(false);
  const t1=new Date("2099-10-18T09:00:00Z"),t2=new Date("2099-10-18T10:00:00Z");
  const events=projectOfferEvidence(
   [{id:"a",fromStatus:"ISSUED",toStatus:"ACCEPTED",reason:null,createdAt:t2}],
   [{id:"b",fromStatus:"PENDING",toStatus:"JOINED",reason:"Verified evidence",createdAt:t1}],
  );
  expect(events.events.map(item=>item.kind)).toEqual(["Joining","Offer"]);
  expect(events).toMatchObject({offerHistoryRecorded:true,joiningHistoryRecorded:true});
  expect(projectOfferEvidence([],[])).toMatchObject({events:[],offerHistoryRecorded:false,joiningHistoryRecorded:false});
 });
});
