import {describe,expect,it} from "vitest";
import {
 canonicalTpoParticipationChange,snapshotTpoMembershipDecision,
 isTpoDecisionSnapshotCurrent,hasTpoDecisionChanged,
 tpoParticipationStatusSchema,tpoMembershipDecisionSchema,tpoParticipationChangeSchema,
} from "@/modules/placements/tpo-participation-model";

const ZERO=snapshotTpoMembershipDecision(null);
const date=new Date("2026-10-18T11:00:00.000Z");
describe("TPO-BREAK-participation-01 decisions, CAS and strict state machine",()=>{
 it("accepts only the three documented intent states and requires reason for ineligibility",()=>{
  for(const status of ["ELIGIBLE","INELIGIBLE","NOT_DECIDED"])
   expect(tpoParticipationStatusSchema.safeParse(status).success).toBe(true);
  for(const bad of ["DISABLED","GRANTED","PENDING","ELIGIBLE ",""])
   expect(tpoParticipationStatusSchema.safeParse(bad).success).toBe(false);
  expect(tpoParticipationChangeSchema.safeParse({
   status:"INELIGIBLE",reason:"not eligible",expected:ZERO,
  }).success).toBe(true);
  expect(tpoParticipationChangeSchema.safeParse({
   status:"INELIGIBLE",expected:ZERO,
  }).success).toBe(false);
  expect(tpoParticipationChangeSchema.safeParse({
   status:"INELIGIBLE",reason:"  ",expected:ZERO,
  }).success).toBe(false);
  expect(tpoParticipationChangeSchema.safeParse({
   status:"ELIGIBLE",expected:ZERO,otherCollege:"spoofed",
  }).success).toBe(false);
 });
 it("does not retain disqualifying reasons when an override becomes eligible or cleared",()=>{
  expect(canonicalTpoParticipationChange({
   status:"INELIGIBLE",reason:"  missing evidence  ",note:"  reviewed  ",
  })).toEqual({status:"INELIGIBLE",reason:"missing evidence",note:"reviewed"});
  expect(canonicalTpoParticipationChange({
   status:"ELIGIBLE",reason:"stale prior reason",note:"  passed  ",
  })).toEqual({status:"ELIGIBLE",reason:null,note:"passed"});
  expect(canonicalTpoParticipationChange({
   status:"NOT_DECIDED",reason:"stale prior reason",note:"never persist",
  })).toEqual({status:null,reason:null,note:null});
 });
 it("distinguishes no override from an explicit change and preserves UTC timestamps exactly",()=>{
  expect(ZERO).toEqual({status:null,reason:null,note:null,updatedAt:null});
  expect(tpoMembershipDecisionSchema.safeParse(ZERO).success).toBe(true);
  const old=snapshotTpoMembershipDecision({status:"ELIGIBLE",reason:null,note:null,updatedAt:date});
  expect(old.updatedAt).toBe("2026-10-18T11:00:00.000Z");
  expect(isTpoDecisionSnapshotCurrent(old,old)).toBe(true);
  expect(isTpoDecisionSnapshotCurrent(old,{...old,updatedAt:"2026-10-18T11:00:00.001Z"})).toBe(false);
  expect(isTpoDecisionSnapshotCurrent(old,{...old,note:"changed"})).toBe(false);
  expect(isTpoDecisionSnapshotCurrent(old,ZERO)).toBe(false);
  expect(tpoMembershipDecisionSchema.safeParse({...old,updatedAt:"yesterday"}).success).toBe(false);
 });
 it("treats identical retry as no-op but detects exact state, note and reason changes",()=>{
  const old={status:"INELIGIBLE" as const,reason:"GPA",note:"Reviewed"};
  expect(hasTpoDecisionChanged(old,{...old})).toBe(false);
  expect(hasTpoDecisionChanged(old,{...old,status:"ELIGIBLE"})).toBe(true);
  expect(hasTpoDecisionChanged(old,{...old,reason:"Attendance"})).toBe(true);
  expect(hasTpoDecisionChanged(old,{...old,note:"Updated"})).toBe(true);
  expect(hasTpoDecisionChanged(old,{status:null,reason:null,note:null})).toBe(true);
 });
});
