import {beforeEach,describe,expect,it,vi} from "vitest";
import {POST} from "@/app/api/projects/[projectId]/mentor-updates/route";

const state=vi.hoisted(()=>({
  origin:true,identityReads:0,writes:0,input:null as unknown,
}));
const projectId="11111111-1111-4111-8111-111111111111";
vi.mock("@/auth/origin",()=>({isSameOriginRequest:()=>state.origin}));
vi.mock("@/auth/request-context",()=>({
  getCurrentRequestContext:async()=>{state.identityReads++;return {user:{id:"mentor"}};},
}));
vi.mock("@/modules/projects/mentor-project-update-service",()=>({
  postMentorProjectUpdate:async(_context:unknown,_projectId:string,body:unknown)=>{
    state.writes++;state.input=body;
    return {id:"saved-event"};
  },
}));
vi.mock("@/lib/api-error",()=>({
  apiErrorResponse:()=>Response.json({error:"UNEXPECTED"},{status:500}),
}));
const params={params:Promise.resolve({projectId})};
function request(body:BodyInit,options?:{contentType?:string,length?:number}){
  return new Request("https://campus.example/api/projects/"+projectId+"/mentor-updates",{
    method:"POST",body,headers:{
      "content-type":options?.contentType??"application/json",
      ...(options?.length===undefined?{}:{"content-length":String(options.length)}),
    },
  });
}
beforeEach(()=>{state.origin=true;state.identityReads=0;state.writes=0;state.input=null;});
describe("Mentor update route bounded 4KB JSON",()=>{
  it("blocks foreign origin before accepting or parsing a body",async()=>{
    state.origin=false;
    const response=await POST(request("{}"),params);
    expect(response.status).toBe(403);
    expect(state.identityReads).toBe(0);
    expect(state.writes).toBe(0);
  });
  it("rejects oversized declared Content-Length without a write",async()=>{
    const response=await POST(request("{}",{length:4097}),params);
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({error:"UPDATE_TOO_LONG"});
    expect(state.writes).toBe(0);
  });
  it("rejects oversized streamed payload without trusting Content-Length",async()=>{
    const response=await POST(request(JSON.stringify({
      message:"x".repeat(4096),
    })),params);
    expect(response.status).toBe(413);
    expect(state.writes).toBe(0);
  });
  it("rejects malformed JSON, incompatible media type and invalid UTF-8",async()=>{
    for(const {req,status} of [
      {req:request("{"),status:400},
      {req:request("message=hello",{contentType:"text/plain"}),status:415},
      {req:request(new Uint8Array([0xc3,0x28])),status:400},
    ]){
      expect((await POST(req,params)).status).toBe(status);
    }
    expect(state.writes).toBe(0);
  });
  it("accepts a valid same-origin JSON update without changing the payload",async()=>{
    const payload={message:"A real sprint update"};
    const response=await POST(request(JSON.stringify(payload)),params);
    expect(response.status).toBe(201);
    expect(state.writes).toBe(1);
    expect(state.input).toEqual(payload);
    expect(await response.json()).toMatchObject({id:"saved-event"});
  });
});
