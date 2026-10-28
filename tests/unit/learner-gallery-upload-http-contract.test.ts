import {beforeEach,describe,expect,it,vi} from "vitest";
import {z} from "zod";

const state=vi.hoisted(()=>({
  origin:true,
  context:vi.fn(),
  initiate:vi.fn(),
  confirm:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:()=>state.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/lib/api-error",()=>({
  apiErrorResponse:()=>Response.json({error:"UNEXPECTED"},{status:500}),
}));
vi.mock("@/modules/profile-verification/learner-image-gallery-service",()=>({
  LearnerGalleryError:class LearnerGalleryError extends Error {
    constructor(public code:string){super(code)}
  },
  initiateOwnLearnerGalleryUpload:state.initiate,
  confirmOwnLearnerGalleryUpload:state.confirm,
}));
import {POST} from "@/app/api/profile/learner-gallery/upload/route";

const objectKey="private/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222/profile-verification/33333333-3333-4333-8333-333333333333";
const url="https://lms.example.edu/api/profile/learner-gallery/upload";
const send=(body:unknown)=>POST(new Request(url,{
  method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body),
}));
beforeEach(()=>{
  state.origin=true;
  state.context.mockReset().mockResolvedValue({user:{id:"active-learner"}});
  state.initiate.mockReset().mockImplementation(async (_:unknown,raw:unknown)=>{
    const input=z.strictObject({
      originalName:z.string(),contentType:z.string(),sizeBytes:z.number(),
    }).parse(raw);
    return {accepted:true,objectName:input.originalName};
  });
  state.confirm.mockReset().mockImplementation(async (_:unknown,raw:unknown)=>{
    const input=z.strictObject({objectKey:z.string()}).parse(raw);
    return {confirmed:true,objectKey:input.objectKey};
  });
});
describe("DB-007 gallery private upload HTTP boundary",()=>{
  it("initiates valid learner image uploads without forwarding the action discriminator",async()=>{
    const resp=await send({action:"INITIATE",originalName:"portrait.png",
      contentType:"image/png",sizeBytes:1024});
    expect(resp.status).toBe(201);
    expect(await resp.json()).toEqual({accepted:true,objectName:"portrait.png"});
    expect(resp.headers.get("cache-control")).toBe("private, no-store");
    expect(state.initiate).toHaveBeenCalledWith(expect.anything(),{
      originalName:"portrait.png",contentType:"image/png",sizeBytes:1024,
    });
    expect(state.confirm).not.toHaveBeenCalled();
  });
  it("confirms scanner-attested object keys without forwarding the action discriminator",async()=>{
    const resp=await send({action:"CONFIRM",objectKey});
    expect(resp.status).toBe(200);
    expect(await resp.json()).toEqual({confirmed:true,objectKey});
    expect(resp.headers.get("cache-control")).toBe("private, no-store");
    expect(state.confirm).toHaveBeenCalledWith(expect.anything(),{objectKey});
    expect(state.initiate).not.toHaveBeenCalled();
  });
  it("rejects arbitrary owner or tenant fields instead of forwarding privileged scope",async()=>{
    for(const body of [
      {action:"INITIATE",originalName:"portrait.png",contentType:"image/png",
        sizeBytes:1024,learnerMembershipId:"forged"},
      {action:"CONFIRM",objectKey,collegeId:"another-college"},
      {action:"APPROVE",objectKey},
    ]){
      const resp=await send(body);
      expect(resp.status).toBe(400);
    }
    expect(state.initiate).not.toHaveBeenCalled();
    expect(state.confirm).not.toHaveBeenCalled();
  });
  it("checks same-origin before creating upload receipts or obtaining context",async()=>{
    state.origin=false;
    const resp=await send({action:"INITIATE",originalName:"portrait.png",
      contentType:"image/png",sizeBytes:1024});
    expect(resp.status).toBe(403);
    expect(state.context).not.toHaveBeenCalled();
    expect(state.initiate).not.toHaveBeenCalled();
    expect(state.confirm).not.toHaveBeenCalled();
  });
});
