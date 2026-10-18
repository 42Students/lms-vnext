import {describe,expect,it} from "vitest";
import {exportTpoStudentsCsv} from "@/modules/placements/tpo-students-csv";
import type {TpoStudentRow} from "@/modules/placements/tpo-students-model";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const base:TpoStudentRow={
 membershipId:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",displayName:"Sample Student",
 email:null,rollNumber:"CS01",registrationNumber:"REG01",
 branchId:COLLEGE,branchName:"Computer Science",programId:COLLEGE,programName:"B.Tech",
 cohortId:COLLEGE,cohortName:"2099",classIds:[],
 registrationChoice:"PLACEMENTS",registeredForPlacements:true,
 participationStatus:"ELIGIBLE",readinessSignal:"PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT",
 preferencesPresent:true,verification:{status:"VERIFIED",waitingSections:[],verifiedSections:["EDUCATION"]},
 cgpa:8.4,activeBacklogs:0,pastBacklogs:0,applicationCount:1,activeApplicationCount:1,
 offerCount:0,offersAwaitingAnswer:0,acceptedOfferCount:0,verifiedExternalOfferCount:0,
 placed:false,journeyState:"APPLYING",bestSoFar:"Applied",
 maximumAppliedRoundSequence:null,ambiguousSection:false,
};
const marksCell=(row:TpoStudentRow)=>{
 const [,body]=exportTpoStudentsCsv([row]).trim().split("\r\n");
 return body.split(",")[17];
};
describe("TPO-students-export-TRUTH-02 marks-verification evidence provenance",()=>{
 it("exports missing marks-verification as empty rather than falsely claiming No",()=>{
  expect(marksCell(base)).toBe('""');
  expect(marksCell({...base,marksVerified:null})).toBe('""');
  expect(marksCell({...base,marksVerified:undefined})).toBe('""');
 });
 it("retains explicit persisted Yes and No outcomes without inferring them from grades",()=>{
  expect(marksCell({...base,marksVerified:true})).toBe('"Yes"');
  expect(marksCell({...base,marksVerified:false})).toBe('"No"');
  expect(marksCell({...base,cgpa:null,marksVerified:true})).toBe('"Yes"');
 });
 it("keeps marks verification in the same legacy CSV column",()=>{
  const [header]=exportTpoStudentsCsv([base]).split("\r\n");
  expect(header.split(",")[17]).toBe('"Marks verified"');
 });
});
