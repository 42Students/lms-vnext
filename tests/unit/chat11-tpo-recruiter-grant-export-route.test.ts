import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
import type {TpoRecruiterGrantView} from "@/modules/placements/tpo-recruiter-access-model";
const mocks=vi.hoisted(()=>({context:vi.fn(),list:vi.fn(),apiError:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/modules/placements/tpo-recruiter-access-service",()=>({
 listTpoRecruiterAccess:mocks.list,
}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:mocks.apiError}));
import {GET} from "@/app/api/placements/tpo/settings/recruiter-grants/export/route";

const row:TpoRecruiterGrantView={
 displayName:"Recruiter",companyName:"Example",designation:null,
 status:"ACTIVE",grantedDate:"18 Oct 2026",revokedDate:null,
 validUntilDate:null,ended:false,capabilities:["DRIVES"],verificationStatus:"VERIFIED",
};
function request(q=""){
 return new Request("https://college.example/api/placements/tpo/settings/recruiter-grants/export"+q);
}
beforeEach(()=>{
 for(const stub of Object.values(mocks))stub.mockReset();
 mocks.context.mockResolvedValue({user:{id:"officer"}});
 mocks.list.mockResolvedValue({items:[row],truncated:false});
 mocks.apiError.mockImplementation(()=>NextResponse.json({error:"ACCESS_DENIED"},{status:403}));
});

describe("TPO-settings-audit-60 recruiter grant exports keep scope and input safe",()=>{
 it("rejects forged tenant and duplicated filters before session reads",async()=>{
  for(const qs of [
   "?collegeId=other","?userId=foreign","?page=1000000","?q=a&q=b",
   "?status=ACTIVE&status=REVOKED","?format=xlsx&format=csv",
   "?format=html","?format=XLSX",
  ]){
   const response=await GET(request(qs));
   expect(response.status,qs).toBe(400);
   expect(await response.json()).toEqual({error:"INVALID_REQUEST"});
   expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  }
  expect(mocks.context).not.toHaveBeenCalled();
  expect(mocks.list).not.toHaveBeenCalled();
 });
 it("accepts bounded caller filters while deriving officer scope server-side",async()=>{
  const response=await GET(request("?status=ACTIVE&q=Example"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Disposition")).toContain('filename="recruiters.csv"');
  expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(mocks.context).toHaveBeenCalledTimes(1);
  expect(mocks.list).toHaveBeenCalledTimes(1);
  expect(mocks.list).toHaveBeenCalledWith({user:{id:"officer"}},{
   status:"ACTIVE",q:"Example",page:1,
  },{exportAll:true});
  expect(await response.text()).toContain("Recruiter");
 });
 it("returns an Office ZIP workbook using the same authorized filtered rows",async()=>{
  const response=await GET(request("?format=xlsx"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Content-Type"))
   .toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  expect(response.headers.get("Content-Disposition")).toContain('filename="recruiters.xlsx"');
  const bytes=new Uint8Array(await response.arrayBuffer());
  expect(Array.from(bytes.slice(0,4))).toEqual([80,75,3,4]);
  expect(mocks.list).toHaveBeenCalledTimes(1);
 });
 it("fails closed on revoked/expired session and never loads the export",async()=>{
  mocks.context.mockRejectedValueOnce(Error("sensitive database detail"));
  const response=await GET(request("?format=xlsx"));
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({error:"ACCESS_DENIED"});
  expect(mocks.list).not.toHaveBeenCalled();
 });
});
