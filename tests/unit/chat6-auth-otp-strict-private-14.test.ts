import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {resetAuthConfigForTests} from "@/modules/auth/config";
import {guardLoginRequest} from "@/modules/auth/http";
import {startLoginWithRuntime,verifyLoginWithRuntime,sendEmailFallbackWithRuntime} from "@/modules/auth/runtime";
import {POST as start} from "@/app/api/auth/login/start/route";
import {POST as verify} from "@/app/api/auth/login/verify/route";
import {POST as resend} from "@/app/api/auth/login/email/route";
vi.mock("@/modules/auth/http",()=>({
 guardLoginRequest:vi.fn(),auditLogin:vi.fn(),ipTag:vi.fn(),loginErrorResponse:vi.fn(),
}));
vi.mock("@/modules/auth/runtime",()=>({
 startLoginWithRuntime:vi.fn(),verifyLoginWithRuntime:vi.fn(),sendEmailFallbackWithRuntime:vi.fn(),
}));
const id="11111111-1111-4111-8111-111111111111";
const membershipId="22222222-2222-4222-8222-222222222222";
const req=(path:string)=>new Request("https://platform.example.test/api/auth/login/"+path,{
 method:"POST",headers:{"Content-Type":"application/json"},body:"{}",
});
const admit=(body:Record<string,unknown>)=>vi.mocked(guardLoginRequest).mockResolvedValue({
 ok:true,body,tenantCollegeId:null,ip:"203.0.113.40",
} as never);
beforeEach(()=>{vi.resetAllMocks();vi.stubEnv("AUTH_SECRET","unit-test-secret-unit-test-secret-unit-test");resetAuthConfigForTests();});
afterEach(()=>{vi.unstubAllEnvs();resetAuthConfigForTests();});
describe("AUTH-OTP-14 strict challenge inputs and noncacheable sign-in",()=>{
 it("rejects unknown body keys in start even when a caller supplies forged college and roles",async()=>{
  admit({channel:"EMAIL",contact:"learner@example.test"});
  vi.mocked(startLoginWithRuntime).mockResolvedValue({attemptId:id,channel:"EMAIL"} as never);
  const response=await start(req("start"));
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  const inputSchema=vi.mocked(guardLoginRequest).mock.calls[0]?.[1];
  expect(inputSchema).toBeDefined();
  expect(inputSchema?.safeParse({channel:"EMAIL",contact:"learner@example.test"}).success).toBe(true);
  expect(inputSchema?.safeParse({channel:"EMAIL",contact:"learner@example.test",collegeId:id}).success).toBe(false);
  expect(inputSchema?.safeParse({channel:"EMAIL",contact:"learner@example.test",systemRole:"SUPER_ADMIN"}).success).toBe(false);
 });
 it("requires a signed-in session to be issued before writing private verification cookies",async()=>{
  admit({attemptId:id,code:"123456"});
  vi.mocked(verifyLoginWithRuntime).mockResolvedValue({
   user:{id:"student"},isSuperAdmin:false,tenantMembershipId:membershipId,
   memberships:[{id:membershipId,status:"ACTIVE"}],
   session:{token:"opaque-device-token",maxAgeSeconds:3600},
  } as never);
  const response=await verify(req("verify"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.cookies.get("lms_session")?.value).toBe("opaque-device-token");
  const schema=vi.mocked(guardLoginRequest).mock.calls[0]?.[1];
  expect(schema?.safeParse({attemptId:id,code:"123456"}).success).toBe(true);
  expect(schema?.safeParse({attemptId:id,code:"123456",tenantCollegeId:id}).success).toBe(false);
  expect(schema?.safeParse({attemptId:id,code:"123456",secondCode:"777777"}).success).toBe(true);
 });
 it("does not cache email fallbacks and ignores attempts to forge a tenant through the body",async()=>{
  admit({attemptId:id});
  vi.mocked(sendEmailFallbackWithRuntime).mockResolvedValue({attemptId:id} as never);
  const response=await resend(req("email"));
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  const schema=vi.mocked(guardLoginRequest).mock.calls[0]?.[1];
  expect(schema?.safeParse({attemptId:id}).success).toBe(true);
  expect(schema?.safeParse({attemptId:id,collegeId:id}).success).toBe(false);
 });
});
