import {describe, expect, it} from "vitest";
import {
  projectTpoStudentPlacementHistory,
  tpoStudentHistoryQuerySchema,
  type HistoryApplicationFact,
  type HistoryOfferFact,
  type HistoryRoundFact,
} from "@/modules/placements/tpo-student-history-model";
import {canPostToTpoCompanyTeam, tpoCompanyTeamPostSchema} from "@/modules/placements/tpo-company-team-model";
import {sortTpoPeople} from "@/modules/placements/tpo-team-people-sort-model";
import {describeTpoCompanyVisibility} from "@/modules/placements/tpo-company-visibility-model";

const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const t=(iso:string)=>new Date(iso);
const recent=t("2026-10-18T09:00:00.000Z");
const old=t("2026-10-17T09:00:00.000Z");

const applications:HistoryApplicationFact[]=[
 {id:A,jobId:"job-A",addedByCollege:false,jobTitle:"Software Engineer",
  companyName:"Employer",seasonName:"2026",roleTitle:"Developer",
  applicationStatus:"SUBMITTED",channel:"PORTAL",submittedAt:old},
 {id:B,jobId:"job-B",addedByCollege:true,jobTitle:"Analyst",
  companyName:"Second",seasonName:"2026",roleTitle:"Analyst",
  applicationStatus:"WITHDRAWN",channel:"COLLEGE",submittedAt:recent},
];
const offers:HistoryOfferFact[]=[
 {id:"offer-a",applicationId:A,status:"ACCEPTED",roleTitle:"Developer",annualCtcInr:750000,
  issuedAt:old,joiningStatus:"JOINED"},
 {id:"offer-b",applicationId:B,status:"ISSUED",roleTitle:"Analyst",annualCtcInr:null,
  issuedAt:recent,joiningStatus:null},
];
const rounds:HistoryRoundFact[]=[
 {id:"stage",applicationId:A,name:"Technical",outcome:"PASSED",status:"STAGED",
  version:2,submittedAt:recent,appliedAt:null},
 {id:"apply",applicationId:A,name:"Technical",outcome:"PASSED",status:"APPLIED",
  version:1,submittedAt:old,appliedAt:old},
 {id:"other",applicationId:B,name:"HR",outcome:"PENDING",status:"STAGED",
  version:1,submittedAt:recent,appliedAt:null},
];

describe("TPO-students-history-01/02 authorization-safe query and persisted chronology",()=>{
 it("rejects forged IDs, malformed pages and extra tenant override keys",()=>{
  expect(tpoStudentHistoryQuerySchema.safeParse({membershipId:A,page:1}).success).toBe(true);
  for(const bad of [
   {membershipId:"../another-college",page:1},
   {membershipId:A,page:0},
   {membershipId:A,page:10001},
   {membershipId:A,page:"NaN"},
   {membershipId:A,page:1,collegeId:B},
  ]) expect(tpoStudentHistoryQuerySchema.safeParse(bad).success).toBe(false);
 });

 it("separates staged from applied result versions without inventing placement events",()=>{
  const history=projectTpoStudentPlacementHistory(applications,offers,rounds);
  expect(history.pageFacts).toMatchObject({
   applications:2,resultVersions:3,stagedResults:2,offerVersions:2,
   acceptedOfferVersions:1,confirmedJoins:1,
  });
  const a=history.items.find(item=>item.id===A)!;
  expect(a.appliedRounds).toHaveLength(1);
  expect(a.appliedRounds[0]).toMatchObject({id:"apply",outcome:"PASSED"});
  expect(a.resultVersions.map(v=>v.id)).toEqual(["stage","apply"]);
  expect(a.applicationEvents).toEqual([]);
  expect(a.offers[0].statusEvents).toEqual([]);
  expect(history.items.find(item=>item.id===B)?.appliedRounds).toEqual([]);
 });

 it("keeps application and offer events scoped to their own records, newest first",()=>{
  const history=projectTpoStudentPlacementHistory(applications,offers,rounds,
   [{id:"a-old",applicationId:A,fromStatus:null,toStatus:"SUBMITTED",createdAt:old},
    {id:"a-new",applicationId:A,fromStatus:"SUBMITTED",toStatus:"IN_REVIEW",createdAt:recent},
    {id:"b",applicationId:B,fromStatus:null,toStatus:"WITHDRAWN",createdAt:recent}],
   [{id:"offer-old",offerId:"offer-a",fromStatus:null,toStatus:"ISSUED",createdAt:old},
    {id:"offer-new",offerId:"offer-a",fromStatus:"ISSUED",toStatus:"ACCEPTED",createdAt:recent},
    {id:"offer-b",offerId:"offer-b",fromStatus:null,toStatus:"ISSUED",createdAt:recent}]);
  expect(history.items[0].applicationEvents.map(e=>e.id)).toEqual(["a-new","a-old"]);
  expect(history.items[1].applicationEvents.map(e=>e.id)).toEqual(["b"]);
  expect(history.items[0].offers[0].statusEvents.map(e=>e.id)).toEqual(["offer-new","offer-old"]);
  expect(history.items[1].offers[0].statusEvents.map(e=>e.id)).toEqual(["offer-b"]);
 });
});

describe("TPO-companies-team-01 safe messages and sharing policy",()=>{
 it("rejects archived relationship writes, blank/oversize messages and invalid idempotency keys",()=>{
  expect(canPostToTpoCompanyTeam("ACTIVE")).toBe(true);
  for(const state of ["ARCHIVED","SUSPENDED","PENDING","ACTIVE ",""])expect(canPostToTpoCompanyTeam(state)).toBe(false);
  const valid={body:"  Confirmed handover  ",idempotencyKey:A};
  expect(tpoCompanyTeamPostSchema.parse(valid).body).toBe("Confirmed handover");
  for(const bad of [
   {...valid,body:"  "},{...valid,body:"a".repeat(4001)},
   {...valid,idempotencyKey:"stale-replay"},{...valid,otherCollegeId:B},
  ])expect(tpoCompanyTeamPostSchema.safeParse(bad).success).toBe(false);
 });

 it("describes all persisted recruiter visibility switches without inferring extra consent",()=>{
  const display=describeTpoCompanyVisibility({
   showCgpaExact:false,showTenthTwelfth:false,showProjectLinks:false,
   showAssessmentScores:false,showAttendance:false,updatedAt:null,
  });
  expect(display.enabledCount).toBe(0);
  expect(display.disabledCount).toBe(5);
  expect(new Set(display.fields.map(f=>f.key)).size).toBe(5);
  expect(display.fields.every(f=>!f.enabled&&f.explanation.includes("does not permit"))).toBe(true);
 });
});

describe("TPO-team-people-01 predictable scope-preserving workload sort",()=>{
 const roster=[
  {membershipId:"z",displayName:"Zoe",studentDuties:["x"],openAsks:2,overdueAsks:0,liveDrives:0},
  {membershipId:"a",displayName:"Asha",studentDuties:[],openAsks:0,overdueAsks:1,liveDrives:1},
  {membershipId:"b",displayName:"Bala",studentDuties:[],openAsks:0,overdueAsks:0,liveDrives:0},
 ];
 it("prioritizes open workload or overdue obligations while never mutating the original roster",()=>{
  const before=roster.map(p=>p.membershipId);
  expect(sortTpoPeople(roster,"WORK").map(p=>p.membershipId)).toEqual(["z","a","b"]);
  expect(sortTpoPeople(roster,"OVERDUE").map(p=>p.membershipId)).toEqual(["a","z","b"]);
  expect(sortTpoPeople(roster,"NAME").map(p=>p.membershipId)).toEqual(["a","b","z"]);
  expect(roster.map(p=>p.membershipId)).toEqual(before);
 });
});
