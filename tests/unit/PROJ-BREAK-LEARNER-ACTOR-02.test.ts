import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";

const state=vi.hoisted(()=>({
 calls:0,
 persisted:true,
 where:[] as unknown[],
 lockTypes:[] as string[],
}));
import {assertPersistedLearnerProjectMutation} from "@/modules/projects/learner-mutation-guard";

const projectId="11111111-1111-4111-8111-111111111111";
const collegeId="22222222-2222-4222-8222-222222222222";
const membershipId="33333333-3333-4333-8333-333333333333";
const userId="44444444-4444-4444-8444-444444444444";
const actor=(options?:{
  collegeId?:string;status?:string;role?:string;platformStatus?:string;userId?:string;
})=>({
 user:{id:options?.userId??userId,platformStatus:options?.platformStatus??"ACTIVE"},
 membership:{id:membershipId,collegeId:options?.collegeId??collegeId,
  status:options?.status??"ACTIVE",roles:[options?.role??"LEARNER"]},
}) as unknown as Parameters<typeof assertPersistedLearnerProjectMutation>[1];

function fakeTx(){
 const chain={
  from(){return chain;},
  innerJoin(_table:unknown,_on:unknown){return chain;},
  where(condition:unknown){state.where.push(condition);return chain;},
  for(lock:string){state.lockTypes.push(lock);return chain;},
  limit(_n:number){return Promise.resolve(state.persisted?[{id:"grant"}]:[]);},
 };
 return {select(){state.calls++;return chain;}} as unknown as Parameters<typeof assertPersistedLearnerProjectMutation>[0];
}
const query=(condition:unknown)=>new PgDialect().sqlToQuery(condition as SQL).sql;
beforeEach(()=>{
 state.calls=0;state.where=[];state.lockTypes=[];state.persisted=true;
});
describe("PROJ-BREAK-LEARNER-ACTOR-02 persisted role-grant test before every mutation",()=>{
 it("allows active learner only with persisted same-project membership and shared lock",async()=>{
  await expect(assertPersistedLearnerProjectMutation(fakeTx(),actor(),projectId,collegeId))
   .resolves.toBeUndefined();
  expect(state.calls).toBe(1);
  expect(state.lockTypes).toEqual(["share"]);
  expect(query(state.where[0])).toContain("project_id");
  expect(query(state.where[0])).toContain("membership_id");
  const service=await import("node:fs");
  for(const path of [
    "src/modules/projects/learner-backlog-pull-service.ts",
    "src/modules/projects/learner-own-task-service.ts",
    "src/modules/projects/learner-task-progress-service.ts",
  ]){
   const source=service.readFileSync(path,"utf8");
   expect(source).toContain("await assertPersistedLearnerProjectMutation(tx,context,");
   expect(source.indexOf("await assertPersistedLearnerProjectMutation(")).toBeLessThan(
     source.indexOf("await tx.insert(")>=0?source.indexOf("await tx.insert("):Infinity);
  }
 });
 it.each([
  {collegeId:"99999999-9999-4999-8999-999999999999"},
  {status:"DISABLED"},
  {role:"FACULTY"},
  {platformStatus:"DISABLED"},
 ])("denies stale user context without querying a grants table: %#",async(options)=>{
  await expect(assertPersistedLearnerProjectMutation(fakeTx(),actor(options),projectId,collegeId))
   .rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.calls).toBe(0);
 });
 it("rejects a deactivated or revoked persisted project grant despite a previously authorized request",async()=>{
  state.persisted=false;
  await expect(assertPersistedLearnerProjectMutation(fakeTx(),actor(),projectId,collegeId))
   .rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.calls).toBe(1);
 });
 it("rejects an actor with no membership before DB access",async()=>{
  const invalid={...actor(),membership:null};
  await expect(assertPersistedLearnerProjectMutation(fakeTx(),invalid as Parameters<typeof assertPersistedLearnerProjectMutation>[1],projectId,collegeId))
   .rejects.toThrow("PROJECT_ACCESS_DENIED");
  expect(state.calls).toBe(0);
 });
});
