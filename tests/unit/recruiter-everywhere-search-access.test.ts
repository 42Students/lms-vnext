import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextRequest} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {searchOwnRecruiterDrives} from "@/modules/placements/recruiter-drive-search-service";
import {GET} from "@/app/api/placements/recruiter/quick-search/route";
import type {RequestContext} from "@/modules/identity/context";
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/modules/placements/recruiter-drive-search-service",()=>({searchOwnRecruiterDrives:vi.fn()}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:()=>new Response("Error",{status:500})}));
const user="11111111-1111-4111-8111-111111111111";
const a="22222222-2222-4222-8222-222222222222";
const b="33333333-3333-4333-8333-333333333333";
function ctx():RequestContext{
 return {user:{id:user,identityUid:"recruiter:test",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{status:"ACTIVE",userId:user,
 companyId:"66666666-6666-4666-8666-666666666666",companyName:"Employer",
 title:null,grants:[a,b].map((collegeId,i)=>({
 id:i===0?"77777777-7777-4777-8777-777777777777":"99999999-9999-4999-8999-999999999999",
 collegeId,collegeName:i===0?"College A":"College B",
 organizationId:"88888888-8888-4888-8888-888888888888",
 companyRelationshipId:i===0?"44444444-4444-4444-8444-444444444444":
 "55555555-5555-4555-8555-555555555555",
 }))}};
}
function req(query:string){return new NextRequest("https://42lms.example/api/placements/recruiter/quick-search?"+query);}
beforeEach(()=>vi.clearAllMocks());
describe("Recruiter Everywhere denies cross-college quick search",()=>{
 it("requires an active recruiter identity",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue({...ctx(),recruiter:null});
  expect((await GET(req("q=engineer"))).status).toBe(403);
  expect(searchOwnRecruiterDrives).not.toHaveBeenCalled();
 });
 it("forces a chooser instead of mixing college grants",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(ctx());
  const response=await GET(req("q=engineer"));
  const data=await response.json() as {chooseCollege:boolean;results:unknown[];choices:{id:string}[]};
  expect(data.chooseCollege).toBe(true);
  expect(data.results).toEqual([]);
  expect(data.choices.map(row=>row.id)).toEqual([a,b]);
  expect(searchOwnRecruiterDrives).not.toHaveBeenCalled();
 });
 it("denies forged IDs, repeated query keys and malformed filters before querying",async()=>{
  vi.mocked(getCurrentRequestContext).mockResolvedValue(ctx());
  const cases=[
   "q=engineer&collegeId=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
   "q=engineer&collegeId="+a+"&collegeId="+b,
   "q=engineer&collegeId=bad",
   "q=engineer&q=student","q=x",
  ];
  for(const query of cases)expect((await GET(req(query))).status).toBeGreaterThanOrEqual(400);
  expect(searchOwnRecruiterDrives).not.toHaveBeenCalled();
 });
});
