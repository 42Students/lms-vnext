import fs from "node:fs";
import path from "node:path";
import {describe,expect,it} from "vitest";
import {isValidMentorSprintTransition,mentorSprintTransitionSchema} from "@/modules/projects/mentor-sprint-write-model";

const lifecycleSource=fs.readFileSync(path.join(process.cwd(),"src","modules","projects","lifecycle-service.ts"),"utf8");
const STATUSES=["PLANNED","ACTIVE","COMPLETED","CANCELLED","","planned","__proto__","constructor"];
const ACTIONS=["START","COMPLETE","REOPEN","CANCEL","DELETE","start","","__proto__"];
const VALID:[string,string][]=[["PLANNED","START"],["ACTIVE","COMPLETE"],["COMPLETED","REOPEN"]];

/** Parses the LEGACY_PROJECT_SPRINT_TRANSITIONS literal out of lifecycle-service.ts without importing the DB layer. */
function legacyCrosswalk(){
 const block=/LEGACY_PROJECT_SPRINT_TRANSITIONS\s*=\s*\{([\s\S]*?)\}\s*as const/.exec(lifecycleSource);
 expect(block,"LEGACY_PROJECT_SPRINT_TRANSITIONS literal not found").not.toBeNull();
 const rows=[...block![1]!.matchAll(/(\w+):\{from:"(\w+)",to:"(\w+)",adminWriter:"(\w+)",mentorAction:"(\w+)"\}/g)]
  .map(m=>({name:m[1]!,from:m[2]!,to:m[3]!,adminWriter:m[4]!,mentorAction:m[5]!}));
 return rows;
}

describe("PHASE1-STATE-SPRINT mentor sprint transition validator",()=>{
 it("PHASE1-STATE-SPRINT-01 allows exactly PLANNED->START, ACTIVE->COMPLETE and COMPLETED->REOPEN (full matrix)",()=>{
  for(const before of STATUSES)for(const action of ACTIONS)
   expect(isValidMentorSprintTransition(before,action),`${JSON.stringify(before)} + ${JSON.stringify(action)}`)
    .toBe(VALID.some(([b,a])=>b===before&&a===action));
 });

 it("PHASE1-STATE-SPRINT-02 a completed sprint cannot be started again and a planned sprint cannot be completed or reopened",()=>{
  expect(isValidMentorSprintTransition("COMPLETED","START")).toBe(false);
  expect(isValidMentorSprintTransition("COMPLETED","COMPLETE")).toBe(false);
  expect(isValidMentorSprintTransition("PLANNED","COMPLETE")).toBe(false);
  expect(isValidMentorSprintTransition("PLANNED","REOPEN")).toBe(false);
  expect(isValidMentorSprintTransition("ACTIVE","START")).toBe(false);
  expect(isValidMentorSprintTransition("ACTIVE","REOPEN")).toBe(false);
 });

 it("PHASE1-STATE-SPRINT-03 the command schema requires a known action, a timestamp for optimistic concurrency, and no extra fields",()=>{
  const ok={action:"START",expectedUpdatedAt:"2099-01-01T04:30:00.123Z"};
  expect(mentorSprintTransitionSchema.safeParse(ok).success).toBe(true);
  expect(mentorSprintTransitionSchema.safeParse({...ok,restoreCarry:true}).success).toBe(true);
  expect(mentorSprintTransitionSchema.safeParse({action:"START"}).success).toBe(false);
  expect(mentorSprintTransitionSchema.safeParse({...ok,expectedUpdatedAt:"yesterday"}).success).toBe(false);
  expect(mentorSprintTransitionSchema.safeParse({...ok,action:"CANCEL"}).success).toBe(false);
  expect(mentorSprintTransitionSchema.safeParse({...ok,status:"COMPLETED"}).success).toBe(false);
  expect(mentorSprintTransitionSchema.safeParse({...ok,restoreCarry:"yes"}).success).toBe(false);
 });
});

describe("PHASE1-STATE-SPRINT-CROSSWALK admin writers match the mentor validator",()=>{
 it("PHASE1-STATE-SPRINT-CROSSWALK-01 the legacy crosswalk lists start, complete and reopen",()=>{
  expect(legacyCrosswalk().map(r=>r.name)).toEqual(["startSprint","completeSprint","reopenSprint"]);
 });

 it("PHASE1-STATE-SPRINT-CROSSWALK-02 every crosswalk row is accepted by the mentor validator and nothing else is",()=>{
  const rows=legacyCrosswalk();
  for(const r of rows)expect(isValidMentorSprintTransition(r.from,r.mentorAction),r.name).toBe(true);
  expect(rows.map(r=>[r.from,r.mentorAction])).toEqual(VALID);
 });

 it("PHASE1-STATE-SPRINT-CROSSWALK-03 the sprint lifecycle is a clean PLANNED -> ACTIVE -> COMPLETED -> ACTIVE chain with no self loops",()=>{
  const rows=legacyCrosswalk();
  for(const r of rows)expect(r.from).not.toBe(r.to);
  const byName=Object.fromEntries(rows.map(r=>[r.name,r]));
  expect(byName.startSprint).toMatchObject({from:"PLANNED",to:"ACTIVE"});
  expect(byName.completeSprint).toMatchObject({from:"ACTIVE",to:"COMPLETED"});
  expect(byName.reopenSprint).toMatchObject({from:"COMPLETED",to:"ACTIVE"});
 });

 it("PHASE1-STATE-SPRINT-CROSSWALK-04 each named admin writer is an exported function in the lifecycle service",()=>{
  for(const r of legacyCrosswalk())
   expect(new RegExp(`export\\s+async\\s+function\\s+${r.adminWriter}\\b`).test(lifecycleSource),r.adminWriter).toBe(true);
 });
});
