import {describe,expect,it} from "vitest";
import {tpoBulkStudentReady,tpoBulkApplicationReady,tpoBulkStudentVersion}
 from "@/modules/placements/tpo-bulk-action-preview-service";
const snapshot={status:null,reason:null,note:null,updatedAt:null};
describe("TPO bulk preview decisions",()=>{
 it("does not overwrite an existing identical eligibility override",()=>{
  expect(tpoBulkStudentReady("ELIGIBLE","ELIGIBLE")).toBe(false);
  expect(tpoBulkStudentReady("ELIGIBLE","INELIGIBLE")).toBe(true);
  expect(tpoBulkStudentReady("CLEAR_OVERRIDE",null)).toBe(false);
  expect(tpoBulkStudentReady("CLEAR_OVERRIDE","ELIGIBLE")).toBe(true);
 });
 it("never treats withdrawn applicants or closed drives as reviewable",()=>{
  expect(tpoBulkApplicationReady("SHORTLISTED","PUBLISHED","SUBMITTED","PENDING",new Date())).toBe(true);
  expect(tpoBulkApplicationReady("REJECTED","PUBLISHED","WITHDRAWN","PENDING",new Date())).toBe(false);
  expect(tpoBulkApplicationReady("REJECTED","CLOSED","SUBMITTED","PENDING",new Date())).toBe(false);
  expect(tpoBulkApplicationReady("REJECTED","PUBLISHED","SUBMITTED",null,null)).toBe(false);
 });
 it("generates a stable opaque CAS version over all stored decision fields",()=>{
  expect(tpoBulkStudentVersion(snapshot)).toMatch(/^[a-f0-9]{64}$/);
  expect(tpoBulkStudentVersion(snapshot)).not.toBe(tpoBulkStudentVersion({...snapshot,note:"changed"}));
 });
});
