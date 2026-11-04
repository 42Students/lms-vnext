import {beforeEach,describe,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({origin:vi.fn(),verify:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:mocks.origin}));
vi.mock("@/modules/placements/company-share/access-service",()=>({
 verifyPublicCompanyShareCode:mocks.verify,
}));
import {POST} from "@/app/company-share/[token]/access/route";

const token="A".repeat(43);
const url="https://share.example.test/company-share/"+token+"/access";
const args={params:Promise.resolve({token})};
const make=(body:string,contentType="application/x-www-form-urlencoded")=>
 new Request(url,{method:"POST",headers:{host:"share.example.test",
  origin:"https://share.example.test","content-type":contentType},body});

beforeEach(()=>{
 vi.clearAllMocks();
 mocks.origin.mockReturnValue(true);
 mocks.verify.mockResolvedValue({kind:"DENIED"});
});

describe("public applicant-share code form rejects untrusted bodies",()=>{
 it("rejects a cross-origin POST before any code verification",async()=>{
  mocks.origin.mockReturnValue(false);
  const response=await POST(make("code=ABC123"),args);
  expect(response.status).toBe(403);
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
  expect(mocks.verify).not.toHaveBeenCalled();
 });
 it("enforces streamed 2KiB cap even when Content-Length lies",async()=>{
  const req=make("code=ABC123&extra="+"z".repeat(3000));
  req.headers.set("content-length","1");
  const response=await POST(req,args);
  expect(response.status).toBe(413);
  expect(mocks.verify).not.toHaveBeenCalled();
 });
 it("rejects unsupported JSON payloads before DB verification",async()=>{
  const response=await POST(make('{"code":"ABC123"}',"application/json"),args);
  expect(response.status).toBe(415);
  expect(mocks.verify).not.toHaveBeenCalled();
 });
 it("rejects duplicate code parameters without choosing one",async()=>{
  const response=await POST(make("code=ABC123&code=DEF456"),args);
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toContain("access=invalid");
  expect(mocks.verify).not.toHaveBeenCalled();
 });
 it("rejects a malformed form without verification",async()=>{
  const response=await POST(make("garbage","multipart/form-data; boundary=absent"),args);
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toContain("access=invalid");
  expect(mocks.verify).not.toHaveBeenCalled();
 });
 it("preserves valid browser urlencoded form and private denial redirect",async()=>{
  const response=await POST(make("code=ABC123"),args);
  expect(mocks.verify).toHaveBeenCalledWith(token,"ABC123");
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toContain("access=invalid");
  expect(response.headers.get("cache-control")).toContain("no-store");
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
 });
 it("preserves a valid multipart browser form within its byte cap",async()=>{
  const form=new FormData();
  form.set("code","ABC123");
  const req=new Request(url,{method:"POST",headers:{origin:"https://share.example.test",
    host:"share.example.test"},body:form});
  const response=await POST(req,args);
  expect(response.status).toBe(303);
  expect(mocks.verify).toHaveBeenCalledWith(token,"ABC123");
 });
 it("issues only the expected httpOnly proof after successful verification",async()=>{
  mocks.verify.mockResolvedValue({kind:"VERIFIED",proof:"f".repeat(64),maxAge:600});
  const response=await POST(make("code=ABC123"),args);
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).not.toContain("access=invalid");
  expect(response.headers.get("set-cookie")).toContain("company_share_access=");
  expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  expect(response.headers.get("set-cookie")?.toLowerCase()).toContain("samesite=strict");
  expect(response.headers.get("referrer-policy")).toBe("no-referrer");
 });
});
