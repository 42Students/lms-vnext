import {beforeEach,describe,expect,it,vi} from "vitest";
import {cookies} from "next/headers";
import {isSameOriginRequest} from "@/auth/origin";
import {revokeSessionByToken} from "@/modules/auth/session-service";
import {logError} from "@/observability/logger";
import {DELETE as logout} from "@/app/api/auth/session/route";

vi.mock("next/headers",()=>({cookies:vi.fn()}));
vi.mock("@/auth/origin",()=>({isSameOriginRequest:vi.fn()}));
vi.mock("@/modules/auth/session-service",()=>({revokeSessionByToken:vi.fn()}));
vi.mock("@/observability/logger",()=>({logError:vi.fn()}));

const request=()=>new Request("https://lms.example.test/api/auth/session",{method:"DELETE"});
beforeEach(()=>{
  vi.resetAllMocks();
  vi.mocked(isSameOriginRequest).mockReturnValue(true);
  vi.mocked(cookies).mockResolvedValue({get:(name:string)=>
    name==="lms_session"?{value:"opaque-token"}:undefined} as never);
});

describe("AUTH-sessions-05 logout is truthful and clears shared-device credentials",()=>{
 it("rejects a cross-site DELETE without reading or revoking the token",async()=>{
  vi.mocked(isSameOriginRequest).mockReturnValue(false);
  const result=await logout(request());
  expect(result.status).toBe(403);
  expect(await result.json()).toEqual({error:"INVALID_ORIGIN"});
  expect(cookies).not.toHaveBeenCalled();
  expect(revokeSessionByToken).not.toHaveBeenCalled();
 });

 it("only reports success after the server token is revoked",async()=>{
  vi.mocked(revokeSessionByToken).mockResolvedValue(undefined);
  const result=await logout(request());
  expect(revokeSessionByToken).toHaveBeenCalledOnce();
  expect(revokeSessionByToken).toHaveBeenCalledWith("opaque-token");
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({ok:true});
  expect(result.headers.get("Cache-Control")).toBe("no-store");
  expect(result.headers.get("Clear-Site-Data")).toBe('"storage"');
  for(const name of ["lms_session","lms_membership","lms_admin_scope"]){
    expect(result.cookies.get(name)?.value).toBe("");
    expect(result.cookies.get(name)?.maxAge).toBe(0);
  }
 });

 it("AUTH-sessions-05 DB outage reports 503, never ok:true; still expires this device's cookies",async()=>{
  vi.mocked(revokeSessionByToken).mockRejectedValueOnce(new Error("postgres-secret-internal"));
  const result=await logout(request());
  expect(result.status).toBe(503);
  expect(await result.json()).toEqual({ok:false,error:"LOGOUT_REVOKE_FAILED"});
  expect(result.headers.get("Cache-Control")).toBe("no-store");
  expect(result.headers.get("Clear-Site-Data")).toBe('"storage"');
  for(const name of ["lms_session","lms_membership","lms_admin_scope"]){
    expect(result.cookies.get(name)?.value).toBe("");
    expect(result.cookies.get(name)?.maxAge).toBe(0);
  }
  expect(logError).toHaveBeenCalledWith("auth.logout_revoke_failed",expect.any(Error));
 });
 it("no prior token is an idempotent logout and never mutates device sessions",async()=>{
  vi.mocked(cookies).mockResolvedValue({get:()=>undefined} as never);
  const result=await logout(request());
  expect(result.status).toBe(200);
  expect(await result.json()).toEqual({ok:true});
  expect(revokeSessionByToken).not.toHaveBeenCalled();
 });
});
