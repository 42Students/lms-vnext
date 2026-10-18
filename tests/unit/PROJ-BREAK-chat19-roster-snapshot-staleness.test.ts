import {describe,expect,it} from "vitest";
import {
  classRosterSnapshotSchema,assertRosterStillCurrent,
} from "@/modules/projects/class-team-roster-snapshot";
import {classRosterRevision} from "@/modules/projects/class-team-roster-service";

const college="11111111-1111-4111-8111-111111111111";
const anotherCollege="22222222-2222-4222-8222-222222222222";
const klass="33333333-3333-4333-8333-333333333333";
const anotherClass="44444444-4444-4444-8444-444444444444";
const members=[
 {membershipId:"55555555-5555-4555-8555-555555555555",rollNumber:"01"},
 {membershipId:"66666666-6666-4666-8666-666666666666",rollNumber:"02"},
];
const snapshot=()=>({
  collegeId:college,classId:klass,
  revision:classRosterRevision(klass,members),
  members:members.map(row=>({...row})),
});
describe("PROJ-BREAK-ROSTER-SNAPSHOT-01: stale UI cannot apply changed class roster",()=>{
 it("accepts only a structurally complete same-tenant roster snapshot",()=>{
  const current=snapshot();
  expect(classRosterSnapshotSchema.safeParse(current).success).toBe(true);
  expect(assertRosterStillCurrent(current,snapshot())).toEqual(current);
 });
 it("rejects changed student membership with the same count and stale revision",()=>{
  const prev=snapshot();
  const changed={...snapshot(),members:[
   members[0]!,
   {membershipId:"77777777-7777-4777-8777-777777777777",rollNumber:"02"},
  ]};
  expect(()=>assertRosterStillCurrent(prev,changed)).toThrow("CLASS_ROSTER_STALE");
 });
 it("rejects changed student roll or revision even when student IDs match",()=>{
  const old=snapshot();
  const changed={...snapshot(),members:[members[0]!,{...members[1]!,rollNumber:"03"}]};
  expect(()=>assertRosterStillCurrent(old,changed)).toThrow("CLASS_ROSTER_STALE");
  expect(()=>assertRosterStillCurrent(old,{...snapshot(),revision:"unrelated"}))
   .toThrow("CLASS_ROSTER_STALE");
 });
 it.each([
  ["college",{collegeId:anotherCollege}],
  ["class",{classId:anotherClass}],
  ["roster size",{members:[members[0]!]}],
 ])("rejects changed %s across stale tabs",(_why,patch)=>{
  expect(()=>assertRosterStillCurrent(snapshot(),{...snapshot(),...patch}))
   .toThrow("CLASS_ROSTER_STALE");
 });
 it("rejects duplicate membership and hidden client-injected status fields",()=>{
  expect(classRosterSnapshotSchema.safeParse({...snapshot(),members:[
   members[0],members[0],
  ]}).success).toBe(false);
  expect(classRosterSnapshotSchema.safeParse({...snapshot(),role:"SUPER_ADMIN"}).success).toBe(false);
  expect(classRosterSnapshotSchema.safeParse({...snapshot(),members:[]}).success).toBe(false);
 });
 it("classRosterRevision deterministically changes on member replacement or roll change",()=>{
  const initial=classRosterRevision(klass,members);
  expect(initial).toMatch(/^[0-9a-f]{8}$/);
  expect(classRosterRevision(klass,members)).toBe(initial);
  expect(classRosterRevision(klass,[members[0]!,{...members[1]!,rollNumber:"99"}]))
    .not.toBe(initial);
  expect(classRosterRevision(klass,[members[0]!])).not.toBe(initial);
 });
});
