import {describe,expect,it} from "vitest";
import {projectFinalFileEvidenceIsVerified}
 from "@/modules/projects/project-final-file-evidence-model";
const valid={
 status:"READY",scanStatus:"CLEAN",objectGeneration:"42",
 scanAttestedBy:"storage-worker",scanAttestedAt:new Date("2026-10-24T12:00:00Z"),
 verifiedContentType:"application/pdf",verifiedSizeBytes:4096,
 completedAt:new Date("2026-10-24T12:00:01Z"),deletedAt:null,
};
describe("Mentor final-delivery clean verified file evidence",()=>{
 it("accepts only completed independently verified file objects",()=>{
  expect(projectFinalFileEvidenceIsVerified(valid)).toBe(true);
  for(const bad of [
   {status:"UPLOADING"},{scanStatus:"PENDING"},{scanStatus:"QUARANTINED"},
   {scanAttestedBy:null},{scanAttestedAt:null},{objectGeneration:"../../1"},
   {verifiedSizeBytes:null},{verifiedSizeBytes:0},
   {verifiedContentType:null},{verifiedContentType:"not-a-mime"},
   {completedAt:null},{deletedAt:new Date("2026-10-24T13:00:00Z")},
  ]){
   expect(projectFinalFileEvidenceIsVerified({...valid,...bad})).toBe(false);
  }
 });
 it("denies missing/invalid rows without reading a file object",()=>{
  expect(projectFinalFileEvidenceIsVerified(null)).toBe(false);
  expect(projectFinalFileEvidenceIsVerified(undefined)).toBe(false);
  expect(projectFinalFileEvidenceIsVerified({...valid,
    scanAttestedAt:new Date("invalid")})).toBe(false);
 });
});
