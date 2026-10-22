import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({
 results:[] as unknown[][],select:vi.fn(),acting:vi.fn(),permission:vi.fn(),
}));
vi.mock("@/modules/permissions/acting-college",()=>({resolveActingCollege:state.acting}));
vi.mock("@/modules/permissions/policy",()=>({
 AuthorizationError:class AuthorizationError extends Error{},
 requirePermission:state.permission,
}));
vi.mock("@/modules/identity/context",()=>({
 hasMembershipRole:(ctx:{membership?:{roles?:string[]}},role:string)=>Boolean(ctx.membership?.roles?.includes(role)),
 isSuperAdmin:(ctx:{user?:{isSuperAdmin?:boolean}})=>Boolean(ctx.user?.isSuperAdmin),
}));
vi.mock("@/db/client",()=>({getDb:()=>({select:state.select,selectDistinct:state.select})}));
import {getCollegeContentAuthoringOptions,getCollegeLessonAuthoringOptions} from "@/modules/courses/college-content-authoring-service";
const active={
 user:{platformStatus:"ACTIVE",isSuperAdmin:false},
 membership:{status:"ACTIVE",roles:["COLLEGE_ADMIN"],collegeId:"college",organizationId:"org"},
};
const context=(value:unknown)=>value as Parameters<typeof getCollegeContentAuthoringOptions>[0];
const lesson={id:"lesson",name:"Lesson",course:"Database",courseCode:"CS200",offeringId:"offering"};
const drafted={id:"content1",lessonId:"lesson",title:"Draft link",offeringId:"offering",
 lessonName:"Lesson",courseCode:"CS200",deliveryId:null,notes:null,
 externalUrl:"https://school.invalid/private-resource",durationSeconds:null,startsAt:null,endsAt:null,
 status:"DRAFT",sequence:1};
beforeEach(()=>{
 state.acting.mockReset();state.permission.mockReset();state.select.mockReset();
 state.results=[];state.acting.mockResolvedValue({collegeId:"acting-college",organizationId:"acting-org"});
 state.select.mockImplementation(()=>({
  from(){return this;},innerJoin(){return this;},leftJoin(){return this;},
  where(){return this;},orderBy(){return this;},
  limit(){return this;},offset(){return this;},
  groupBy(){return Promise.resolve(state.results.shift()??[]);},
  then(resolve:(rows:unknown[])=>unknown,reject:(reason:unknown)=>unknown){
   return Promise.resolve(state.results.shift()??[]).then(resolve,reject);
  },
 }));
});
describe("COURSES-WEAK-CONTENT-AUTHORING-01 tenant, stage and private link boundaries",()=>{
 it("rejects Learner/Faculty/inactive College Admin before database read",async()=>{
  for(const bad of [
   {...active,membership:{...active.membership,roles:["LEARNER"]}},
   {...active,membership:{...active.membership,roles:["FACULTY"]}},
   {...active,membership:{...active.membership,status:"ENDED"}},
   {...active,user:{...active.user,platformStatus:"SUSPENDED"}},
   {...active,membership:null},
  ]){
   await expect(getCollegeContentAuthoringOptions(context(bad),"RESOURCE")).rejects.toThrow();
  }
  expect(state.select).not.toHaveBeenCalled();
 });
 it("Super Admin resolves acting college scope instead of trusting membership's stale college",async()=>{
  state.results=[[],[],[]];
  const sa={user:{isSuperAdmin:true,platformStatus:"ACTIVE"},membership:null};
  const result=await getCollegeContentAuthoringOptions(context(sa),"RESOURCE");
  expect(state.acting).toHaveBeenCalledWith(context(sa),"courses.manage");
  expect(state.permission).toHaveBeenCalledWith(context(sa),"courses.manage",{
   collegeId:"acting-college",organizationId:"acting-org",
  });
  expect(result.lessons).toEqual([]);
 });
 it("never exposes published external playback URL in metadata editor while retaining editable drafts",async()=>{
  state.results=[
   [lesson],
   [{deliveryId:"delivery",offeringId:"offering",sectionName:"A",sectionCode:"A"}],
   [], // Faculty teaching assignments are fetched before existing lesson content.
   [{...drafted},{...drafted,id:"content2",status:"PUBLISHED",
     startsAt:new Date("2026-10-18T04:35:00Z"),endsAt:new Date("2026-10-18T05:35:00Z")}],
   [{lessonId:"lesson",highest:3}],
  ];
  const result=await getCollegeContentAuthoringOptions(context(active),"RESOURCE");
  expect(result.lessons[0].nextSequence).toBe(4);
  expect(result.existing).toHaveLength(2);
  expect(result.existing[0].externalUrl).toBe(drafted.externalUrl);
  expect(result.existing[1].externalUrl).toBeNull();
  expect(result.existing[1].startsAt).toBe("2026-10-18T04:35:00.000Z");
  expect(state.permission).toHaveBeenCalledWith(context(active),"courses.manage",{
   collegeId:"college",organizationId:"org",
  });
 });
 it("honestly flags the paginated resource list without leaking entries past the page limit",async()=>{
  state.results=[[],[],[],Array.from({length:16},(_,i)=>({...drafted,id:"c"+i}))];
  const result=await getCollegeContentAuthoringOptions(context(active),"RESOURCE");
  expect(result.existing).toHaveLength(15);
  expect(result.existingPageSize).toBe(15);
  expect(result.existingTruncated).toBe(true);
 });
 it("lesson creation includes empty offerings and derives next sequence only from existing active lesson rows",async()=>{
  state.results=[
   [{offeringId:"offering",courseName:"Database",courseCode:"CS200",
     cohortName:"B",periodName:"T",pathId:"path"},
    {offeringId:"new",courseName:"New",courseCode:"CS201",
     cohortName:"B",periodName:"T",pathId:null}],
   [{pathId:"path",sequence:3},{pathId:"path",sequence:7}],
  ];
  const result=await getCollegeLessonAuthoringOptions(context(active));
  expect(result.map(row=>row.nextSequence)).toEqual([8,0]);
  expect(state.permission).toHaveBeenCalledWith(context(active),"courses.manage",{
   collegeId:"college",organizationId:"org",
  });
 });
});
