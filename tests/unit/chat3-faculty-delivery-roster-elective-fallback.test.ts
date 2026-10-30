import {beforeEach,describe,expect,it,vi} from "vitest";
vi.mock("server-only",()=>({}));
const stubs=vi.hoisted(()=>({
 elective:null as Record<string,unknown>|null,
 backed:null as Record<string,unknown>|null,
 sectionRows:[] as Array<Record<string,unknown>>,
 electiveRows:[] as Array<Record<string,unknown>>,
 reads:[] as string[],
}));
vi.mock("@/db/client",()=>({getDb:()=>({
 select:(fields:Record<string,unknown>)=>{
  const type="offeringStatus" in fields?"elective":
   "id" in fields && !("membershipId" in fields)?"backed":
   "membershipId" in fields?"roster":"other";
  stubs.reads.push(type);
  class Query {
   joins:string[]=[];
   from(){return this;}
   innerJoin(){this.joins.push("inner");return this;}
   leftJoin(){this.joins.push("left");return this;}
   where(){return this;}
   // Drizzle select builders are thenable; the active elective roster is
   // awaited directly, without an orderBy/limit call.
   then(resolve:(rows:Record<string,unknown>[])=>unknown,reject?:(reason:unknown)=>unknown){
    return Promise.resolve(type==="roster"?stubs.electiveRows:stubs.sectionRows).then(resolve,reject);
   }
   async limit(){
    const chosen=type==="elective"?stubs.elective:stubs.backed;
    return chosen?[chosen]:[];
   }
   async orderBy(){
    return stubs.elective?stubs.electiveRows:stubs.sectionRows;
   }
  }
  return new Query();
 },
})}));
import {listActiveDeliveryLearners} from "@/modules/courses/delivery-roster";
const scope={
 deliveryId:"11111111-1111-4111-8111-111111111111",
 sectionId:"22222222-2222-4222-8222-222222222222",
 academicPeriodId:"33333333-3333-4333-8333-333333333333",
 collegeId:"44444444-4444-4444-8444-444444444444",
};
const activeElective={
 groupId:"55555555-5555-4555-8555-555555555555",
 offeringStatus:"ACTIVE",offeringDeletedAt:null,
 slotStatus:"ACTIVE",slotDeletedAt:null,
 groupStatus:"ACTIVE",groupDeletedAt:null,
};
beforeEach(()=>{
 stubs.elective=null;stubs.backed=null;
 stubs.sectionRows=[{membershipId:"entire-section-student"}];
 stubs.electiveRows=[{membershipId:"elective-only-student"}];
 stubs.reads=[];
});
describe("FAC-DELIVERY-ROSTER-ELECTIVE-04 invalid elective never falls back to Section",()=>{
 it("shows only persisted active elective group learners for a healthy elective-backed delivery",async()=>{
  stubs.elective=activeElective;
  const rows=await listActiveDeliveryLearners(scope);
  expect(rows).toEqual([{membershipId:"elective-only-student"}]);
  expect(stubs.reads).toEqual(["elective","roster"]);
 });
 it("denies a disabled or deleted elective without querying any Section membership",async()=>{
  for(const bad of [
   {...activeElective,offeringStatus:"ARCHIVED"},
   {...activeElective,slotDeletedAt:new Date()},
   {...activeElective,groupStatus:"ARCHIVED"},
   {...activeElective,groupDeletedAt:new Date()},
  ]){
   stubs.elective=bad;stubs.reads=[];
   await expect(listActiveDeliveryLearners(scope)).resolves.toEqual([]);
   expect(stubs.reads).toEqual(["elective"]);
  }
 });
 it("fails closed if an elective backing exists but a foreign/missing slot or group breaks the authorized join",async()=>{
  stubs.elective=null;
  stubs.backed={id:"backed-elective-in-invalid-relationship"};
  await expect(listActiveDeliveryLearners(scope)).resolves.toEqual([]);
  expect(stubs.reads).toEqual(["elective","backed"]);
  expect(stubs.reads).not.toContain("roster");
 });
 it("still reads the normal Section roster for a delivery with no elective backing",async()=>{
  stubs.elective=null;stubs.backed=null;
  const rows=await listActiveDeliveryLearners(scope);
  expect(rows).toEqual([{membershipId:"entire-section-student"}]);
  expect(stubs.reads).toEqual(["elective","backed","roster"]);
 });
});