import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mock=vi.hoisted(()=>({
 persisted:vi.fn(),scope:vi.fn(),db:vi.fn(),select:vi.fn(),writer:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:mock.scope}));
vi.mock("@/modules/placements/tpo-persisted-actor-service",()=>({
 requirePersistedTpoMembership:mock.persisted,
}));
vi.mock("@/modules/placements/request-service",()=>({
 actOnPlacementRequest:mock.writer,
}));
import {decideTpoRequest} from "@/modules/placements/tpo-request-decision-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const REQUEST="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const context:RequestContext={
 user:{id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd",identityUid:"tpo-decision",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
};
const payload={
 confirmed:true,action:"APPROVE",note:"",
 expectedUpdatedAt:"2099-01-01T10:00:00.000Z",
} as const;
describe("TPO-requests-verification-01 persisted TPO authorization before request lookup",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.persisted.mockResolvedValue(context.membership!.id);
  mock.scope.mockResolvedValue({id:COLLEGE,organizationId:ORG});
  mock.select.mockImplementation(()=>({
   from(){return this;},innerJoin(){return this;},where(){return this;},
   limit:()=>Promise.resolve([{id:REQUEST}]),
  }));
  mock.db.mockReturnValue({select:mock.select});
  mock.writer.mockResolvedValue({status:"APPROVED"});
 });
 it("a revoked role cannot distinguish a real request from a guessed ID",async()=>{
  mock.persisted.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(decideTpoRequest(context,REQUEST,payload)).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.persisted).toHaveBeenCalledWith(context,COLLEGE);
  expect(mock.scope).not.toHaveBeenCalled();
  expect(mock.db).not.toHaveBeenCalled();
  expect(mock.writer).not.toHaveBeenCalled();
 });
 it("invalid request IDs and malformed confirmation fail before private reads",async()=>{
  await expect(decideTpoRequest(context,"../../other-college",payload)).rejects.toBeDefined();
  await expect(decideTpoRequest(context,REQUEST,{...payload,confirmed:false})).rejects.toBeDefined();
  expect(mock.persisted).not.toHaveBeenCalled();
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("valid decisions retain transaction-writer CAS, checked college and exact expected version",async()=>{
  await expect(decideTpoRequest(context,REQUEST,payload)).resolves.toEqual({status:"APPROVED"});
  expect(mock.persisted).toHaveBeenCalledTimes(1);
  expect(mock.scope).toHaveBeenCalledWith(context,COLLEGE);
  expect(mock.writer).toHaveBeenCalledWith(context,REQUEST,{
   action:"APPROVE",note:null,
  },payload.expectedUpdatedAt);
 });
 it("a missing request stays not found and never reaches the decision writer",async()=>{
  mock.select.mockImplementationOnce(()=>({
   from(){return this;},innerJoin(){return this;},where(){return this;},
   limit:()=>Promise.resolve([]),
  }));
  await expect(decideTpoRequest(context,REQUEST,payload))
   .rejects.toMatchObject({code:"PLACEMENT_REQUEST_NOT_FOUND"});
  expect(mock.writer).not.toHaveBeenCalled();
 });
});
