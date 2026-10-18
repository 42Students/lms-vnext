import {beforeEach,describe,expect,it,vi} from "vitest";
import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {dispatchTpoCampaign,TpoCampaignDispatchError}
 from "@/modules/messaging/tpo-campaign-dispatch-service";
import {POST as sendCampaign}
 from "@/app/api/placements/tpo/campaigns/drafts/[campaignId]/send/route";

vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:vi.fn()}));
vi.mock("@/lib/api-error",()=>({
 apiErrorResponse:vi.fn(()=>Response.json({error:"OPERATION_UNAVAILABLE"},{status:500})),
}));
vi.mock("@/modules/messaging/tpo-campaign-dispatch-service",async(importOriginal)=>{
 const actual=await importOriginal<typeof import("@/modules/messaging/tpo-campaign-dispatch-service")>();
 return {...actual,dispatchTpoCampaign:vi.fn()};
});

const id="11111111-1111-4111-8111-111111111111";
const request=()=>new Request("https://college.example.edu/api/placements/tpo/campaigns/drafts/"+id+"/send",{
 method:"POST",
});
const post=(campaignId=id)=>sendCampaign(request(),{params:Promise.resolve({campaignId})});
const actor={user:{id:"tpo-user",identityUid:"uid",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",collegeId:"college-1",organizationId:"org-1",status:"ACTIVE",roles:["TPO"]}};

beforeEach(()=>{
 vi.clearAllMocks();
 vi.mocked(isSameOriginRequest).mockReturnValue(true);
 vi.mocked(getCurrentRequestContext).mockResolvedValue(
  actor as Awaited<ReturnType<typeof getCurrentRequestContext>>,
 );
});

describe("chat-16 authenticated TPO campaign dispatch HTTP boundary",()=>{
 it("TPO-CAMPAIGN-HTTP-16 blocks cross-origin POST before retrieving an actor or dispatching",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  const response=await post();
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({error:"INVALID_ORIGIN"});
  expect(getCurrentRequestContext).not.toHaveBeenCalled();
  expect(dispatchTpoCampaign).not.toHaveBeenCalled();
 });
 it("TPO-CAMPAIGN-HTTP-17 never masks an invalid campaign identifier as successful delivery",async()=>{
  vi.mocked(dispatchTpoCampaign).mockRejectedValue(
   z.string().uuid().parse.bind(null,"invalid-uuid"),
  );
  const error=new z.ZodError([{code:"custom",message:"INVALID_UUID",path:[]}]);
  vi.mocked(dispatchTpoCampaign).mockRejectedValue(error);
  const response=await post("not-a-campaign");
  expect(response.status).toBe(422);
  expect(await response.json()).toEqual({error:"INVALID_CAMPAIGN"});
 });
 it.each([
  ["NOT_READY",503],["NOT_FOUND",404],["INVALID_STATE",409],
 ] as const)("TPO-CAMPAIGN-HTTP-18 maps %s into %i without a fake success",async(code,status)=>{
  vi.mocked(dispatchTpoCampaign).mockRejectedValue(new TpoCampaignDispatchError(code));
  const response=await post();
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual({error:code});
  expect(response.headers.get("Cache-Control")).toBe("no-store");
 });
 it("TPO-CAMPAIGN-HTTP-19 retains only server-confirmed dispatch counts, no guessed delivery",async()=>{
  const result={campaignId:id,sent:0,failed:1,skipped:2};
  vi.mocked(dispatchTpoCampaign).mockResolvedValue(result as Awaited<ReturnType<typeof dispatchTpoCampaign>>);
  const response=await post();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.json()).toEqual(result);
  expect(dispatchTpoCampaign).toHaveBeenCalledExactlyOnceWith(
   expect.objectContaining({user:expect.objectContaining({id:"tpo-user"})}),id,
  );
 });
 it("TPO-CAMPAIGN-HTTP-20 redacts unexpected provider and database exceptions",async()=>{
  vi.mocked(dispatchTpoCampaign).mockRejectedValue(new Error("secrets and private recruiter contacts"));
  const response=await post();
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({error:"OPERATION_UNAVAILABLE"});
  expect(apiErrorResponse).toHaveBeenCalledOnce();
 });
});
