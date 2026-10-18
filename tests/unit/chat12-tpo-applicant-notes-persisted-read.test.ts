import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mock=vi.hoisted(()=>({db:vi.fn(),college:vi.fn(),actor:vi.fn(),tx:vi.fn(),select:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
vi.mock("@/modules/placements/tpo-job-write-base",()=>({
 requireTpoJobCollege:mock.college,requireTpoJobActor:mock.actor,
}));
import {listTpoApplicantNotes} from "@/modules/placements/applicant-notes-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const JOB="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const APPLICATION="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const NOTE="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const USER="eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
const ctx:RequestContext={
 user:{id:USER,identityUid:"tpo-notes",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"ffffffff-ffff-4fff-8fff-ffffffffffff",
  collegeId:COLLEGE,organizationId:"11111111-1111-4111-8111-111111111111",
  status:"ACTIVE",roles:["TPO"]},
};

describe("TPO-BREAK-applicant-notes-revoke-01 private note read under persisted actor SHARE lock",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.college.mockResolvedValue(COLLEGE);
  mock.actor.mockResolvedValue(undefined);
  mock.select.mockImplementation((projection:Record<string,unknown>)=>{
   const scope=Object.hasOwn(projection,"jobTitle");
   const body=Object.hasOwn(projection,"body");
   const tally=Object.hasOwn(projection,"total");
   const rows=scope?[{jobTitle:"Developer",relationshipId:JOB}]:
    body?[{id:NOTE,authorUserId:USER,authorName:"Placement team",body:"Private interview note",
     createdAt:new Date("2099-01-02T04:00:00Z")}]:
    tally?[{total:1}]:[{id:NOTE}];
   const builder={
    from(){return this;},innerJoin(){return this;},where(){return this;},
    orderBy(){return this;},limit:async()=>rows,
    then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(rows).then(resolve),
   };
   return builder;
  });
  mock.tx.mockImplementation(async(fn:(tx:{select:typeof mock.select})=>Promise<unknown>)=>fn({select:mock.select}));
  mock.db.mockReturnValue({transaction:mock.tx});
 });
 it("a revoked persisted TPO role aborts before resolving any private application or note row",async()=>{
  mock.actor.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(listTpoApplicantNotes(ctx,JOB,APPLICATION)).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.tx).toHaveBeenCalledTimes(1);
  expect(mock.select).not.toHaveBeenCalled();
 });
 it("a wrong-college request is denied even before opening the read transaction",async()=>{
  mock.college.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(listTpoApplicantNotes(ctx,JOB,APPLICATION)).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.tx).not.toHaveBeenCalled();
 });
 it("reads only after the live actor check and returns the snapshot inside the same transaction",async()=>{
  mock.actor.mockImplementation(async()=>{
   expect(mock.select).not.toHaveBeenCalled();
  });
  const snapshot=await listTpoApplicantNotes(ctx,JOB,APPLICATION);
  expect(snapshot).toMatchObject({
   total:1,latestNoteId:NOTE,truncated:false,
   notes:[{id:NOTE,authorName:"Placement team",body:"Private interview note",mine:true}],
  });
  expect(mock.actor).toHaveBeenCalledTimes(1);
  expect(mock.tx).toHaveBeenCalledTimes(1);
  expect(mock.select).toHaveBeenCalledTimes(4);
 });
});
