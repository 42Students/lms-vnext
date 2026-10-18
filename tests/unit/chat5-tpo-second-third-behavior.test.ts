import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {
 tpoRoundResultViewSchema,projectTpoRoundResultTable,filterTpoRoundResultRows,
 type RoundResultEntry,
} from "@/modules/placements/tpo-round-result-table-model";
import {
 offerRegisterQuery,projectOfferRegister,tpoDriveOfferRegisterCsv,offerExpiryIndicator,offerResponseHoursRemaining,optionalOfferInstantIso,
 type OfferRegisterFact,
} from "@/modules/placements/tpo-drive-offer-register-model";
import {tpoOfferEvidenceQuery,projectOfferEvidence} from "@/modules/placements/tpo-offer-evidence-model";
import {readTpoBulkRequestBody,TpoBulkBodyError,TPO_BULK_BODY_MAX_BYTES} from "@/modules/placements/tpo-bulk-request-body";

const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const uuid="11111111-1111-4111-8111-111111111111";
const job="/tpo/placements/jobs/[jobId]/";
const page=(fragment:string)=>src("src/app/(authenticated)"+job+fragment+"/page.tsx");
const at=new Date("2099-10-18T10:00:00Z");

describe("TPO bounded mutation request contracts",()=>{
 it("PLACEMENTS-SELECTION-BODY-41 PLACEMENTS-CANCEL-BODY-42 protect every scoped TPO mutation before parsing",()=>{
  const routes=[
   "src/app/api/placements/tpo/jobs/[jobId]/selections/route.ts",
   "src/app/api/placements/tpo/jobs/[jobId]/waitlist-promote/route.ts",
   "src/app/api/placements/jobs/[jobId]/offers/lifecycle/route.ts",
   "src/app/api/placements/tpo/jobs/[jobId]/close-preview/route.ts",
   "src/app/api/placements/tpo/jobs/[jobId]/cancel-preview/route.ts",
  ];
  for(const route of routes){
   const code=src(route);
   const post=code.slice(code.indexOf("export async function POST("));
   const origin=post.indexOf("isSameOriginRequest(");
   const decode=post.indexOf("readTpoBulkRequestBody(");
   expect(origin,route).toBeGreaterThanOrEqual(0);
   expect(decode,route).toBeGreaterThan(origin);
   expect(post,route).toContain("TpoBulkBodyError");
   expect(post,route).toContain("error instanceof TpoBulkBodyError");
   expect(post,route).toContain("apiErrorResponse(");
   expect(post,route).not.toMatch(/await (?:req|request)\.json\(\)/);
  }
 });
 it("PLACEMENTS-OFFER-REQUEST-44 and PLACEMENTS-CASCADE-UNDO-BODY-45 cap every offer-changing POST",()=>{
  const routes=[
    "src/app/api/placements/applications/[applicationId]/offers/route.ts",
    "src/app/api/placements/offers/[offerId]/actions/route.ts",
    "src/app/api/placements/jobs/[jobId]/offers/bulk-withdraw/route.ts",
    "src/app/api/placements/tpo/offers/[offerId]/cascade-undo/route.ts",
  ];
  for(const route of routes){
    const source=src(route);
    const post=source.slice(source.indexOf("export async function POST("));
    const origin=post.indexOf("isSameOriginRequest(request)");
    const parse=post.indexOf("readTpoBulkRequestBody(request)");
    expect(origin,route).toBeGreaterThanOrEqual(0);
    expect(parse,route).toBeGreaterThan(origin);
    expect(post,route).toContain("err instanceof TpoBulkBodyError" .replace("err",route.includes("cascade-undo")?"err":"error"));
    expect(post,route).toContain("status:");
    expect(post,route).not.toContain("request.json()");
  }
  const undo=src("src/app/api/placements/tpo/offers/[offerId]/cascade-undo/route.ts");
  expect(undo).toContain("body.safeParse(await readTpoBulkRequestBody(request))");
  expect(undo).toContain("Invalid undo confirmation.");
  expect(undo.indexOf("readTpoBulkRequestBody(request)"))
    .toBeLessThan(undo.indexOf("undoPlacementOfferCascade(ctx,offerId,input.data.cascadeId)"));
 });
 it("PLACEMENTS-JOINING-BODY-43 caps all joining corrections before parsing untrusted request data",()=>{
  const route=src("src/app/api/placements/offers/[offerId]/joining/route.ts");
  const put=route.slice(route.indexOf("export async function PUT("));
  const origin=put.indexOf("isSameOriginRequest(request)");
  const decode=put.indexOf("readTpoBulkRequestBody(request)");
  expect(origin).toBeGreaterThanOrEqual(0);
  expect(decode).toBeGreaterThan(origin);
  expect(put).toContain("recordPlacementJoiningOutcome(");
  expect(put).toContain("error instanceof TpoBulkBodyError");
  expect(put).toContain("status:error.status");
  expect(put).not.toContain("request.json()");
  expect(route).toContain('"Cache-Control":"private, no-store"');
 });
 it("PLACEMENTS-SELECTION-BODY-41 maps parser failure on POST, not in the read-only GET route",()=>{
  const source=src("src/app/api/placements/tpo/jobs/[jobId]/selections/route.ts");
  const get=source.slice(source.indexOf("export async function GET("),
    source.indexOf("export async function POST("));
  const post=source.slice(source.indexOf("export async function POST("));
  expect(get).not.toContain("TpoBulkBodyError");
  expect(get).not.toContain("readTpoBulkRequestBody(");
  expect(post).toContain("const body=await readTpoBulkRequestBody(request)");
  expect(post).toContain("if(error instanceof TpoBulkBodyError)");
  expect(post).toContain("status:error.status");
 });
 it("PLACEMENTS-SELECTION-BODY-13 rejects chunked excess, invalid media and malformed JSON without unbounded parsing",async()=>{
  const request=(payload:string,contentType="application/json")=>new Request(
   "https://campus.example/api/placements/tpo/jobs/id/selections",{
    method:"POST",headers:{"content-type":contentType},body:payload,
   });
  const accepted=await readTpoBulkRequestBody(request('{"action":"RECORD","entries":[]}'));
  expect(accepted).toMatchObject({action:"RECORD"});
  for(const [body,type,status] of [
   ['{"action":"RECORD"}',"text/plain",415],
   ['{"action":"RECORD"',"application/json",400],
   ["x".repeat(TPO_BULK_BODY_MAX_BYTES+1),"application/json",413],
  ] as const){
   await expect(readTpoBulkRequestBody(request(body,type))).rejects.toMatchObject({
    status,
   } satisfies Pick<TpoBulkBodyError,"status">);
  }
 });
});

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
 it("PLACEMENTS-WAIT-UI-10 prevents synchronous double-submit and contains broken JSON error responses",()=>{
  const control=src("src/components/placements/tpo-waitlist-promotion-control.tsx");
  expect(control).toContain("const inFlight=useRef(false)");
  expect(control).toContain("if(!preview.next||inFlight.current||reason.trim().length<3)return");
  expect(control).toContain("inFlight.current=true");
  expect(control).toContain("inFlight.current=false");
  expect(control).toContain("apiFetch<{seatNumber?:number}>");
  expect(control).toContain("timeoutMs:35000");
  expect(control).toContain('typeof data?.seatNumber!=="number"');
  expect(control).toContain("Number.isSafeInteger(data.seatNumber)");
  expect(control).toContain("data.seatNumber<1");
  expect(control).not.toContain("await fetch(");
  expect(control).not.toContain("new Error(data.error)");
  expect(control).toContain("Refresh the preview before retrying.");
  expect(control).toContain("setConfirmOpen(false)");
  expect(control).toContain("setError(");
 });
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
 it("PLACEMENTS-OFFERS-EXPIRY-07 never crashes or invents response hours for malformed optional timestamps",()=>{
  const asOf=new Date("2099-10-18T10:00:00.000Z");
  const invalid=new Date(Number.NaN);
  const broken:OfferRegisterFact={offer:{
    id:"invalid-optional",status:"ISSUED",kind:"OFFER",roleTitle:"Engineer",
    annualCtcInr:900000,issuedAt:asOf,respondedAt:invalid,expiresAt:invalid,
    acceptedDisputableUntil:invalid,
  },joining:null,candidate};
  expect(optionalOfferInstantIso(invalid)).toBeNull();
  expect(optionalOfferInstantIso(asOf)).toBe(asOf.toISOString());
  expect(offerResponseHoursRemaining("ISSUED",invalid,asOf)).toBeNull();
  expect(offerResponseHoursRemaining("ISSUED",asOf,invalid)).toBeNull();
  expect(offerResponseHoursRemaining("ACCEPTED",asOf,asOf)).toBeNull();
  const projected=projectOfferRegister([broken],"ALL",1,"","ALL",asOf);
  expect(projected.rows[0]).toMatchObject({
    expires:null,responded:null,acceptedDisputableUntil:null,
    respondByHours:null,expiryIndicator:"UNKNOWN",
  });
  const csv=tpoDriveOfferRegisterCsv([broken],offerRegisterQuery.parse({jobId:uuid}));
  expect(csv.totalMatching).toBe(1);
  expect(csv.csv).toContain("Not recorded");
  expect(csv.csv).toContain("UNKNOWN");
  expect(csv.csv).not.toContain("NaN");
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
  for(const bound of [" ", "  ", null, undefined]){
    const parsed=offerRegisterQuery.parse({jobId:uuid,minCtcLpa:bound,maxCtcLpa:bound});
    expect(parsed.minCtcLpa).toBeUndefined();
    expect(parsed.maxCtcLpa).toBeUndefined();
  }
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
