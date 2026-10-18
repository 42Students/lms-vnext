import {describe,expect,it} from "vitest";
import {
 filterTpoStudentRoster,selectTpoStudentWorkingSet,tpoStudentNeedsAttention,
 tpoStudentMatchesLegacyStage,tpoStudentRegisteredForPlacements,
 type TpoStudentRow,type TpoStudentRosterFilter,
} from "@/modules/placements/tpo-students-model";

const COLLEGE="22222222-2222-4222-8222-222222222222";
const A="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const B="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const base:TpoStudentRow={
 membershipId:A,displayName:"Akhil",email:"test@example.invalid",rollNumber:"CS001",registrationNumber:"R001",
 branchId:COLLEGE,branchName:"Computer Science",programId:COLLEGE,programName:"B.Tech",
 cohortId:COLLEGE,cohortName:"2026",classIds:[COLLEGE],registrationChoice:"PLACEMENTS",
 registeredForPlacements:true,participationStatus:"ELIGIBLE",readinessSignal:"PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT",
 preferencesPresent:true,verification:{status:"VERIFIED",waitingSections:[],verifiedSections:["EDUCATION","IDENTITY"]},
 cgpa:8.25,activeBacklogs:0,pastBacklogs:1,applicationCount:3,activeApplicationCount:1,
 offerCount:1,offersAwaitingAnswer:1,acceptedOfferCount:0,verifiedExternalOfferCount:0,
 placed:false,journeyState:"APPLYING",bestSoFar:"Shortlisted",
 profileFacts:{gender:"Female",birthYear:2005,skills:3,projects:2,certifications:1,experiences:0,
 links:true,resume:true,codingProfiles:true,pgPercentage:null,degree:null,entranceExam:null,
 phoneMasked:"••••1234",linkedIn:null,github:null,portfolio:null},
 hiddenSearchMatched:false,skillNameMatched:false,
 bestCompany:"Employer",bestDriveResults:[],interviewedCompanies:["Employer"],
 maximumAppliedRoundSequence:3,ambiguousSection:false,
};
const rows:TpoStudentRow[]=[
 base,
 {...base,membershipId:B,displayName:"Bala",rollNumber:"CS002",participationStatus:"INELIGIBLE",
  registrationChoice:null,registeredForPlacements:false,journeyState:"NEEDS_READINESS_SUPPORT",
  cgpa:null,marksVerified:false,offersAwaitingAnswer:0,offerCount:0,activeBacklogs:null,
  profileFacts:{...base.profileFacts!,projects:0,skills:0,hasResume:false,resume:false},
  verification:{status:"WAITING",waitingSections:["EDUCATION"],verifiedSections:[]},
  fromFinishedBatch:true,interviewedCompanies:[],maximumAppliedRoundSequence:null},
];
const query=(extra:Partial<TpoStudentRosterFilter>={})=>({page:1,pageSize:25,...extra});
const ids=(filter:Partial<TpoStudentRosterFilter>)=>filterTpoStudentRoster(rows,query(filter)).items.map(row=>row.membershipId);
describe("TPO-students-roster-01 scoped facet intersections and no false project verification",()=>{
 it("intersects independent academic, journey, project-count and verification facets",()=>{
  expect(ids({minCgpa:8,minProjects:2,profileStatus:"VERIFIED"})).toEqual([A]);
  expect(ids({minCgpa:8,minProjects:3})).toEqual([]);
  expect(ids({minCgpa:8,profileStatus:"WAITING"})).toEqual([]);
  expect(ids({cgpaRecorded:false,needsAttention:true})).toEqual([B]);
  expect(ids({interviewedWith:"employer",minRoundReached:3})).toEqual([A]);
  expect(ids({interviewedWith:"employer",minRoundReached:4})).toEqual([]);
  expect(ids({hasResume:true,hasCodingProfiles:true,hasProfileLinks:true})).toEqual([A]);
  expect(ids({minSkills:1,gender:"Female"})).toEqual([A]);
 });
 it("never manufactures academic values from null evidence",()=>{
  expect(ids({maxCgpa:9})).toEqual([A]);
  expect(ids({maxActiveBacklogs:1})).toEqual([A]);
  expect(ids({minProjects:1})).toEqual([A]);
  expect(ids({minProjects:0})).toEqual([A,B]);
 });
 it("searches only the authorized in-memory working set, sorts deterministically and paginates",()=>{
  expect(ids({search:"  COMPUTER SCIENCE " })).toEqual([A,B]);
  expect(ids({search:"CS002"})).toEqual([B]);
  expect(ids({search:"Unrelated college student"})).toEqual([]);
  expect(filterTpoStudentRoster(rows,query({page:2,pageSize:1})).items.map(x=>x.membershipId)).toEqual([B]);
  expect(filterTpoStudentRoster(rows,query()).total).toBe(2);
  expect(filterTpoStudentRoster(rows,query()).totalPages).toBe(1);
 });
 it("keeps finished batches out of default decisions but reachable explicitly",()=>{
  expect(selectTpoStudentWorkingSet(rows,false).map(x=>x.membershipId)).toEqual([A]);
  expect(selectTpoStudentWorkingSet(rows,true).map(x=>x.membershipId)).toEqual([A,B]);
 });
 it("distinguishes authentic registration from inferred profile data",()=>{
  expect(tpoStudentRegisteredForPlacements("PLACEMENTS",0)).toBe(true);
  expect(tpoStudentRegisteredForPlacements(null,1)).toBe(true);
  expect(tpoStudentRegisteredForPlacements(null,0)).toBe(false);
  expect(tpoStudentRegisteredForPlacements("HIGHER_STUDIES",2)).toBe(false);
  expect(tpoStudentMatchesLegacyStage(base,"VERIFIED")).toBe(true);
  expect(tpoStudentMatchesLegacyStage(rows[1],"VERIFIED")).toBe(false);
  expect(tpoStudentNeedsAttention(rows[1])).toBe(true);
  expect(tpoStudentNeedsAttention(base)).toBe(true);
 });
});
