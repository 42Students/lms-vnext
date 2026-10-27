import {beforeEach,describe,expect,it,vi} from "vitest";

const state=vi.hoisted(()=>({
 authenticated:true,allowed:true,
 calls:[] as Array<{page:number;pageSize:number;status:string;kind:string;q:string}>,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/request-context",()=>({
 getCurrentRequestContext:async()=>{
  if(!state.authenticated)throw new Error("AUTH_REQUIRED");
  return {user:{id:"tpo-actor"},membership:{collegeId:"college-a"}};
 },
}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:()=>Response.json({error:"ACCESS_DENIED"},{status:403}),
}));
vi.mock("@/modules/placements/tpo-general-request-service",()=>({
 TpoGeneralRequestError:class extends Error{
  constructor(readonly code:string){super(code);}
 },
 listTpoGeneralRequests:async(_ctx:unknown,query:{
  page:number;pageSize:number;status:string;kind:string;q:string;
 })=>{
  if(!state.allowed)throw Error("REVOKED_TPO");
  state.calls.push(query);
  return {requests:[{id:"scoped-one",kind:query.kind==="ALL"?"ABSENCE_DISPUTE":query.kind,
    status:query.status==="ALL"?"PENDING":query.status}],
    total:1,page:query.page,pageSize:query.pageSize,totalPages:1,status:query.status,
    kind:query.kind,q:query.q};
 },
}));
import {GET} from "@/app/api/placements/tpo/requests/general/route";

const endpoint="https://example.invalid/api/placements/tpo/requests/general";
const call=(query="")=>GET(new Request(endpoint+query));
beforeEach(()=>{state.authenticated=true;state.allowed=true;state.calls=[];});
describe("TPO general request filter HTTP contract",()=>{
 it("defaults to tenant-scoped waiting with no search and no public caching",async()=>{
  const response=await call();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(state.calls).toEqual([{page:1,pageSize:25,status:"PENDING",kind:"ALL",q:""}]);
  const body=await response.json() as {requests:{id:string}[];total:number};
  expect(body.requests[0]?.id).toBe("scoped-one");
  expect(body.total).toBe(1);
 });
 it("passes sanitized explicit kind, status, page and learner search",async()=>{
  const response=await call("?page=2&pageSize=10&kind=ABSENCE_DISPUTE&status=ALL&q=%20Alice%20");
  expect(response.status).toBe(200);
  expect(state.calls).toEqual([{page:2,pageSize:10,status:"ALL",kind:"ABSENCE_DISPUTE",q:"Alice"}]);
 });
 it("rejects unknown selectors, duplicates, invalid bounds and broad single-letter probes",async()=>{
  for(const q of [
   "?collegeId=another", "?userId=another", "?page=1&page=2",
   "?kind=ALL&kind=ABSENCE_DISPUTE", "?q=Ana&q=Bob",
   "?q=a", "?page=0", "?pageSize=1000", "?kind=UNSAFE",
   "?status=PENDING&status=APPROVED", "?status=UNKNOWN",
  ]){
   expect((await call(q)).status,q).toBe(400);
  }
  expect(state.calls).toHaveLength(0);
 });
 it("rejects unauthenticated or unauthorized officers without returning request records",async()=>{
  state.authenticated=false;
  expect((await call("?q=Alice")).status).toBe(403);
  state.authenticated=true;state.allowed=false;
  expect((await call("?q=Alice")).status).toBe(403);
  expect(state.calls).toHaveLength(0);
 });
});
