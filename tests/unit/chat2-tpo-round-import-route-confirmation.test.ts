import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),preview:vi.fn(),stage:vi.fn(),error:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:state.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:state.error}));
vi.mock("@/modules/placements/tpo-round-import-service",()=>({
 previewTpoRoundImport:state.preview,stageTpoRoundImport:state.stage,
}));
import {POST} from "@/app/api/placements/tpo/jobs/[jobId]/rounds/[roundId]/import-results/route";

const jobId="00000000-0000-4000-8000-000000000001";
const roundId="00000000-0000-4000-8000-000000000002";
const ctx={user:{id:"tpo"},membership:{id:"tpo-member"}};
const params={params:Promise.resolve({jobId,roundId})};
const request=(action:string,extras:Record<string,string>={}):Request=>{
 const form=new FormData();
 form.set("file",new File(["Application ID,Result\n"+jobId+",PASS\n"],"results.csv",{type:"text/csv"}));
 form.set("action",action);
 for(const [key,value] of Object.entries(extras))form.set(key,value);
 return new Request("https://college.example/api/placements/tpo/jobs/"+jobId+"/rounds/"+roundId+"/import-results",
  {method:"POST",body:form});
};
beforeEach(()=>{
 vi.clearAllMocks();
 state.origin.mockReturnValue(true);
 state.context.mockResolvedValue(ctx);
 state.preview.mockResolvedValue({previewToken:"preview-token",sourceRows:1});
 state.stage.mockResolvedValue({staged:1,skipped:0,unmatched:0,results:[]});
});

describe("TPO-drive-workspace-40 import-preview and confirmed staging route",()=>{
 it("TPO-drive-workspace-40 rejects cross-origin imports before fetching session or CSV",async()=>{
  state.origin.mockReturnValue(false);
  const result=await POST(request("STAGE_IMPORT",{confirmed:"true"}),params);
  expect(result.status).toBe(403);
  expect(state.context).not.toHaveBeenCalled();
  expect(state.preview).not.toHaveBeenCalled();
  expect(state.stage).not.toHaveBeenCalled();
 });
 it("TPO-drive-workspace-40 never stages a reviewed preview unless caller explicitly confirms it",async()=>{
  for(const confirmed of [undefined,"false","yes","1"]){
   const result=await POST(request("STAGE_IMPORT",{
    ...(confirmed?{confirmed}:{}),
    previewToken:"a".repeat(64),missingPolicy:"LEAVE_PENDING",
   }),params);
   expect(result.status).toBe(400);
   const payload=await result.json();
   expect(payload.error).toContain("Confirm");
  }
  expect(state.stage).not.toHaveBeenCalled();
 });
 it("TPO-drive-workspace-40 separately requires consent before marking all unmatched candidates Not cleared",async()=>{
  for(const confirmMissingFailure of [undefined,"false","yes"]){
   const result=await POST(request("STAGE_IMPORT",{
    confirmed:"true",previewToken:"a".repeat(64),missingPolicy:"MARK_NOT_CLEARED",
    ...(confirmMissingFailure?{confirmMissingFailure}:{}),
   }),params);
   expect(result.status).toBe(400);
  }
  expect(state.stage).not.toHaveBeenCalled();
 });
 it("TPO-drive-workspace-40 previews without confirmation and sends no stage mutation",async()=>{
  const result=await POST(request("PREVIEW"),params);
  expect(result.status).toBe(200);
  expect(await result.json()).toMatchObject({sourceRows:1});
  expect(state.preview).toHaveBeenCalledWith(ctx,jobId,roundId,expect.any(Buffer),"results.csv");
  expect(state.stage).not.toHaveBeenCalled();
 });
 it("TPO-drive-workspace-40 passes explicit staged confirmation, preview token and missing-student choice into stage service",async()=>{
  const result=await POST(request("STAGE_IMPORT",{
   confirmed:"true",confirmMissingFailure:"true",missingPolicy:"MARK_NOT_CLEARED",
   previewToken:"a".repeat(64),overrides:"[]",skippedLines:"[]",
  }),params);
  expect(result.status).toBe(200);
  expect(await result.json()).toMatchObject({staged:1});
  expect(state.stage).toHaveBeenCalledWith(ctx,jobId,roundId,expect.any(Buffer),"results.csv",{
   action:"STAGE_IMPORT",confirmed:true,previewToken:"a".repeat(64),
   missingPolicy:"MARK_NOT_CLEARED",overrides:[],skippedLines:[],
  });
 });
 it("TPO-drive-workspace-40 refuses unsupported actions instead of uploading anything",async()=>{
  const result=await POST(request("FORCE_STAGE",{confirmed:"true"}),params);
  expect(result.status).toBe(400);
  expect(state.stage).not.toHaveBeenCalled();
  expect(state.preview).not.toHaveBeenCalled();
 });
});
