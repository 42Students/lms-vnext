import {beforeEach,describe,expect,it,vi} from "vitest";
import {NextResponse} from "next/server";
import {
 readCollegeLogoForm,CollegeLogoRequestError,
} from "@/modules/colleges/college-logo-request-body";

const mocks=vi.hoisted(()=>({
 origin:vi.fn(),context:vi.fn(),upload:vi.fn(),error:vi.fn(),
}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/auth/request-context",()=>({getCurrentRequestContext:mocks.context}));
vi.mock("@/lib/api-error",()=>({apiErrorResponse:mocks.error}));
vi.mock("@/modules/colleges/admin-branding-logo-service",()=>({
 CollegeLogoError:class CollegeLogoError extends Error{},
 uploadCollegeLogo:mocks.upload,getPublicCollegeLogo:vi.fn(),removeCollegeLogo:vi.fn(),
}));
import {POST} from "@/app/api/colleges/[collegeId]/branding/logo/route";

const id="11111111-1111-4111-8111-111111111111";
const url="https://college.example/api/colleges/"+id+"/branding/logo";
const actor={user:{id:"real-super-admin"},membership:null};
const params={params:Promise.resolve({collegeId:id})};
const body=(fileCount=1)=>
 Array.from({length:fileCount},()=>[
  "--boundary99",
  'Content-Disposition: form-data; name="file"; filename="test.png"',
  "Content-Type: image/png",
  "",
  "PNG pretend payload",
 ].join("\r\n")).join("\r\n")+"\r\n--boundary99--\r\n";
const make=(raw:string,contentType="multipart/form-data; boundary=boundary99")=>
 new Request(url,{method:"POST",headers:{"content-type":contentType},body:raw});

beforeEach(()=>{
 for(const mock of Object.values(mocks))mock.mockReset();
 mocks.origin.mockReturnValue(true);
 mocks.context.mockResolvedValue(actor);
 mocks.upload.mockResolvedValue({logoUrl:"/api/colleges/"+id+"/branding/logo",width:512});
 mocks.error.mockImplementation(()=>NextResponse.json({error:"ACCESS_DENIED"},{status:403}));
});

describe("SA-tenants-modules-BRAND-05 college logo POST boundary",()=>{
 it("reads a valid single multipart file within the cap",async()=>{
  const form=await readCollegeLogoForm(make(body()));
  expect([...form.keys()]).toEqual(["file"]);
  expect(form.get("file")).toBeInstanceOf(File);
  const response=await POST(make(body()),params);
  expect(response.status).toBe(200);
  expect((await response.json()).width).toBe(512);
  expect(mocks.upload).toHaveBeenCalledTimes(1);
  expect(mocks.upload.mock.calls[0][0]).toBe(actor);
  expect(mocks.upload.mock.calls[0][1]).toBe(id);
 });
 it("denies forged origin before opening a session or reading file data",async()=>{
  mocks.origin.mockReturnValueOnce(false);
  const response=await POST(make(body()),params);
  expect(response.status).toBe(403);
  expect(mocks.context).not.toHaveBeenCalled();
  expect(mocks.upload).not.toHaveBeenCalled();
 });
 it("denies expired sessions without parsing multipart or invoking storage",async()=>{
  mocks.context.mockRejectedValueOnce(Error("expired session"));
  const result=await POST(make(body()),params);
  expect(result.status).toBe(403);
  expect(await result.json()).toEqual({error:"ACCESS_DENIED"});
  expect(mocks.upload).not.toHaveBeenCalled();
 });
 it("rejects missing boundary, wrong MIME type and duplicate file parts",async()=>{
  for(const request of [
   make(body(),"text/plain"),
   make(body(),"multipart/form-data"),
   make(body(2)),
  ]){
   const response=await POST(request,params);
   expect(response.status).toBe(400);
  }
  expect(mocks.upload).not.toHaveBeenCalled();
 });
 it("rejects over-3-MiB streams with 413 before upload",async()=>{
  const big=make("x".repeat(3*1024*1024+1));
  const response=await POST(big,params);
  expect(response.status).toBe(413);
  expect(await response.json()).toEqual({error:"LOGO_TOO_LARGE"});
  expect(mocks.upload).not.toHaveBeenCalled();
 });
 it("uses stable errors for malformed data without returning raw body",async()=>{
  const bad=make("--boundary99\r\ncontent is not form data\r\n--boundary99--");
  await expect(readCollegeLogoForm(bad)).rejects.toBeInstanceOf(CollegeLogoRequestError);
  const response=await POST(make("--boundary99\r\ninvalid\r\n--boundary99--"),params);
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({error:"INVALID_REQUEST"});
 });
});
