import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 scope:vi.fn(),select:vi.fn(),
 rows:[] as Array<Array<Record<string,unknown>>>,
}));
vi.mock("@/modules/permissions/acting-college",()=>({
 resolveActingCollege:mocks.scope,
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:()=>{
   mocks.select();
   return {
    from(){return this;},innerJoin(){return this;},where(){return this;},
    limit:()=>Promise.resolve(mocks.rows.shift()??[]),
    groupBy:()=>Promise.resolve(mocks.rows.shift()??[]),
    // A Drizzle SELECT is awaitable even without .limit / .groupBy.
    then(resolve:(rows:Record<string,unknown>[])=>unknown,reject:(error:unknown)=>unknown){
     return Promise.resolve(mocks.rows.shift()??[]).then(resolve,reject);
    },
   };
  },
 }),
}));
import {getPromotionFacultyReadiness} from "@/modules/academics/college-promotion-faculty-readiness";

const actor:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"member",collegeId:"11111111-1111-4111-8111-111111111111",
  organizationId:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const program="22222222-2222-4222-8222-222222222222";
const cohort="33333333-3333-4333-8333-333333333333";
beforeEach(()=>{
 mocks.scope.mockReset();mocks.select.mockReset();mocks.rows.length=0;
 mocks.scope.mockResolvedValue({
  collegeId:actor.membership!.collegeId,
  organizationId:actor.membership!.organizationId,
 });
});
describe("COL-promotion-faculty-02 persisted target-term advisory behavior",()=>{
 it("denies revoked College Admin actor before any academic scope query",async()=>{
  mocks.scope.mockRejectedValueOnce(new Error("ACTOR_REVOKED"));
  await expect(getPromotionFacultyReadiness(actor,program,cohort,4))
   .rejects.toThrow("ACTOR_REVOKED");
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("does not look up a foreign or missing cohort's courses",async()=>{
  mocks.rows.push([]);
  expect(await getPromotionFacultyReadiness(actor,program,cohort,4)).toEqual({
   incomplete:true,missingCourses:0,totalCourses:0,
  });
  expect(mocks.select).toHaveBeenCalledTimes(1);
 });
 it("marks an unmapped target term unready without checking unrelated teaching assignments",async()=>{
  mocks.rows.push([{id:cohort}],[]);
  expect(await getPromotionFacultyReadiness(actor,program,cohort,4)).toEqual({
   incomplete:true,missingCourses:0,totalCourses:0,
  });
  expect(mocks.select).toHaveBeenCalledTimes(2);
 });
 it("counts only distinct current active target course IDs and reports missing courses",async()=>{
  mocks.rows.push([{id:cohort}],
   [{courseId:"c1"},{courseId:"c2"},{courseId:"c3"}],
   [{courseId:"c1",total:2},{courseId:"c3",total:1}]);
  expect(await getPromotionFacultyReadiness(actor,program,cohort,4)).toEqual({
   incomplete:true,missingCourses:1,totalCourses:3,
  });
  expect(mocks.select).toHaveBeenCalledTimes(3);
  expect(mocks.scope).toHaveBeenCalledWith(actor,"academics.read");
 });
 it("reports complete only when every mapped course has eligible current faculty",async()=>{
  mocks.rows.push([{id:cohort}],
   [{courseId:"c1"},{courseId:"c2"}],
   [{courseId:"c1",total:1},{courseId:"c2",total:1}]);
  expect(await getPromotionFacultyReadiness(actor,program,cohort,4)).toMatchObject({
   incomplete:false,missingCourses:0,totalCourses:2,
  });
 });
});
