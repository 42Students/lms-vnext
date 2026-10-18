import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
const mocks=vi.hoisted(()=>({db:vi.fn(),select:vi.fn(),table:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.db}));
vi.mock("@/modules/placements/staged-tables",()=>({placementTableExists:mocks.table}));
import {listOwnTpoPrepAssignments} from "@/modules/placements/tpo-prep-assignment-service";
const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ctx:RequestContext={
 user:{id:"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",identityUid:"learner-prep",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  collegeId:COLLEGE,organizationId:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  status:"ACTIVE",roles:["LEARNER"]},
};
describe("TPO-students-10 learner prep assignment current-membership boundary",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.table.mockResolvedValue(true);
  mocks.select.mockImplementation(()=>({
   from(){return this;},innerJoin(){return this;},where(){return this;},
   limit:()=>Promise.resolve([]),
  }));
  mocks.db.mockReturnValue({select:mocks.select});
 });
 it("revoked learner role rejects archived course assignment reads before checking a table",async()=>{
  await expect(listOwnTpoPrepAssignments(ctx)).rejects.toBeInstanceOf(AuthorizationError);
  expect(mocks.select).toHaveBeenCalledTimes(1);
  expect(mocks.table).not.toHaveBeenCalled();
 });
 it("a cached college membership for a suspended learner never accesses prep records",async()=>{
  const suspended:RequestContext={...ctx,membership:{...ctx.membership!,status:"SUSPENDED"}};
  await expect(listOwnTpoPrepAssignments(suspended)).rejects.toBeInstanceOf(AuthorizationError);
  expect(mocks.db).not.toHaveBeenCalled();
 });
 it("a Faculty cookie cannot read learner preparation assignments",async()=>{
  const faculty:RequestContext={...ctx,membership:{...ctx.membership!,roles:["FACULTY"]}};
  await expect(listOwnTpoPrepAssignments(faculty)).rejects.toBeInstanceOf(AuthorizationError);
  expect(mocks.db).not.toHaveBeenCalled();
 });
});
