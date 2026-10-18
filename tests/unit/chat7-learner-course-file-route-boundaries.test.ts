import {beforeEach,describe,expect,it,vi} from "vitest";
const state=vi.hoisted(()=>({
 context:vi.fn(),file:vi.fn(),config:vi.fn(),head:vi.fn(),sign:vi.fn(),
}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:state.context}));
vi.mock("@/modules/courses/learner-course-file-reference-service",()=>({
 getLearnerCourseFileReference:state.file,
}));
vi.mock("@/modules/storage/r2-config",()=>({getPrivateR2Config:state.config}));
vi.mock("@/modules/storage/s3-client",()=>({headObject:state.head,presignUrl:state.sign}));
import {GET} from "@/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route";

const deliveryId="11111111-1111-4111-8111-111111111111";
const contentId="22222222-2222-4222-8222-222222222222";
const key="student-safe/lesson/my notes.pdf";
const config={bucket:"private-courses"};
const request=(query="")=>new Request("https://app.invalid/api/courses/deliveries/"+deliveryId+
 "/contents/"+contentId+"/file"+query);
const params={params:Promise.resolve({deliveryId,contentId})};
beforeEach(()=>{
 state.context.mockReset().mockResolvedValue({user:{id:"learner"}});
 state.file.mockReset().mockResolvedValue(key);
 state.config.mockReset().mockReturnValue(config);
 state.head.mockReset().mockResolvedValue({sizeBytes:1024});
 state.sign.mockReset().mockReturnValue("https://private.example.edu/presigned-file?signature=redacted");
});
describe("LEARNER-COURSE-FILE-ROUTE-02 signed learner download security and recovery",()=>{
 it("rejects duplicate, unknown and malformed query parameters before any auth or storage work",async()=>{
  for(const query of [
   "?download=1&download=0","?download=true","?download=3","?other=1",
   "?download=1&other=1",
  ]){
   const response=await GET(request(query),params);
   expect(response.status).toBe(400);
   expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  }
  expect(state.context).not.toHaveBeenCalled();
  expect(state.file).not.toHaveBeenCalled();
  expect(state.head).not.toHaveBeenCalled();
 });
 it("resolves one learner-scoped file reference before issuing any storage capability",async()=>{
  const response=await GET(request(),params);
  expect(response.status).toBe(302);
  expect(state.file).toHaveBeenCalledWith(await state.context.mock.results[0]!.value,deliveryId,contentId);
  expect(state.head).toHaveBeenCalledWith(config,key);
  expect(state.sign).toHaveBeenCalledWith(config,{
   method:"GET",key,expiresSeconds:900,query:undefined,
  });
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  expect(response.headers.get("Location")).toContain("https://private.example.edu");
 });
 it("denies hidden or scheduled files before any R2 lookup or signing",async()=>{
  state.file.mockResolvedValueOnce(null);
  const response=await GET(request(),params);
  expect(response.status).toBe(404);
  expect(state.config).not.toHaveBeenCalled();
  expect(state.head).not.toHaveBeenCalled();
  expect(state.sign).not.toHaveBeenCalled();
 });
 it("never signs an absent/zero-byte/quarantined-or-unavailable storage reference",async()=>{
  for(const evidence of [null,{sizeBytes:0}]){
   state.head.mockResolvedValueOnce(evidence);
   expect((await GET(request(),params)).status).toBe(404);
  }
  state.head.mockRejectedValueOnce(Error("Private cloud credentials"));
  const unavailable=await GET(request(),params);
  expect(unavailable.status).toBe(503);
  expect(await unavailable.text()).not.toContain("Private cloud credentials");
  expect(state.sign).not.toHaveBeenCalled();
 });
 it("sanitizes attachment names when the authorized learner requests download=1",async()=>{
  const response=await GET(request("?download=1"),params);
  expect(response.status).toBe(302);
  expect(state.sign).toHaveBeenCalledWith(config,{
   method:"GET",key,expiresSeconds:900,
   query:{"response-content-disposition":'attachment; filename="my_notes.pdf"'},
  });
 });
});
