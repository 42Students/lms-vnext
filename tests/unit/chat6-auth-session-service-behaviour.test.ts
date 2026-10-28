import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import {getDb} from "@/db/client";
import {getAuthConfig} from "@/modules/auth/config";
import {
  createSession,resolveSession,revokeSessionByToken,revokeAllSessionsForUser,
  revokeOtherSessions,revokeOwnSession,listActiveSessions,
} from "@/modules/auth/session-service";
vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/auth/config",()=>({getAuthConfig:vi.fn()}));

const execute=vi.fn();
const userId="11111111-1111-4111-8111-111111111111";
const otherUser="22222222-2222-4222-8222-222222222222";
const sessionId="33333333-3333-4333-8333-333333333333";
const validRow={
  session_id:sessionId,user_id:userId,identity_uid:"identity-1",
  platform_status:"ACTIVE",revoked:false,expired:false,
};
beforeEach(()=>{
  vi.resetAllMocks();
  execute.mockReset();
  vi.mocked(getDb).mockReturnValue({execute} as never);
  vi.mocked(getAuthConfig).mockReturnValue({
    secret:"s".repeat(40),sessionMaxAgeSeconds:3600,
  } as never);
});

describe("AUTH-sessions-06: DB-backed device lifecycle and fail-closed revocation",()=>{
  it("unknown token is invalid; does not mutate last seen",async()=>{
    execute.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[]});
    await expect(resolveSession("unknown-opaque")).resolves.toEqual({ok:false,reason:"SESSION_INVALID"});
    expect(execute).toHaveBeenCalledTimes(2);
  });
  it("revoked, expired and platform-disabled sessions never reach authenticated context",async()=>{
    for(const [patch,reason] of [
      [{revoked:true},"SESSION_REVOKED"],
      [{expired:true},"SESSION_EXPIRED"],
      [{platform_status:"DISABLED"},"SESSION_REVOKED"],
    ] as const){
      execute.mockReset();
      execute.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[{...validRow,...patch}]});
      await expect(resolveSession("opaque-token")).resolves.toEqual({ok:false,reason});
      expect(execute).toHaveBeenCalledTimes(2);
    }
  });
  it("active session yields only authenticated identity and throttles last-seen writes",async()=>{
    execute.mockResolvedValueOnce({rows:[validRow]});
    const resolved=await resolveSession("opaque-token");
    expect(resolved).toEqual({ok:true,session:{
      sessionId,userId,identityUid:"identity-1",platformStatus:"ACTIVE",
    }});
    expect(execute).toHaveBeenCalledOnce();
  });
  it("AUTH-sessions-12 last-seen bookkeeping never touches revoked or expired device rows",()=>{
    const source=readFileSync("src/modules/auth/session-service.ts","utf8");
    const start=source.indexOf("export async function resolveSession(");
    const end=source.indexOf("export async function revokeSessionByToken(",start);
    const section=source.slice(start,end);
    expect(section).toContain("UPDATE identity_device_sessions AS s");
    expect(section).toContain("s.revoked_at IS NULL");
    expect(section).toContain("s.expires_at > clock_timestamp()");
    expect(section).toContain("s.last_seen_at < clock_timestamp() - interval '60 seconds'");
    expect(section).toContain("FOR SHARE OF u");
  });
  it("session token is generated only after a database write succeeds",async()=>{
    execute.mockResolvedValueOnce({rows:[]});
    const session=await createSession(userId,{deviceName:"IIT Dharwad laptop",ipAddress:"203.0.113.2"});
    expect(session.token.length).toBeGreaterThanOrEqual(40);
    expect(session.maxAgeSeconds).toBe(3600);
    expect(execute).toHaveBeenCalledOnce();
    execute.mockReset();
    execute.mockRejectedValueOnce(new Error("database unavailable"));
    await expect(createSession(userId)).rejects.toThrow("database unavailable");
  });
  it("logout revocation propagates the database error, not a false success",async()=>{
    execute.mockRejectedValueOnce(new Error("connection lost"));
    await expect(revokeSessionByToken("opaque-token")).rejects.toThrow("connection lost");
    expect(execute).toHaveBeenCalledOnce();
  });
  it("bulk disablement propagates errors and sends intended authenticated owner",async()=>{
    execute.mockResolvedValueOnce({rows:[]});
    await revokeAllSessionsForUser(userId,otherUser,"ACCOUNT_DISABLED");
    expect(execute).toHaveBeenCalledOnce();
    execute.mockRejectedValueOnce(new Error("down"));
    await expect(revokeAllSessionsForUser(userId,otherUser,"ACCOUNT_DISABLED")).rejects.toThrow("down");
  });
  it("sign-out-other-devices returns the persisted count; never invents sessions",async()=>{
    execute.mockResolvedValueOnce({rows:[{id:sessionId},{id:"other-device"}]});
    await expect(revokeOtherSessions(userId,"my-active-session")).resolves.toBe(2);
    execute.mockResolvedValueOnce({rows:[]});
    await expect(revokeOtherSessions(userId,"my-active-session")).resolves.toBe(0);
  });
  it("IDOR: another owner's session never reports revoked on a zero-row update",async()=>{
    execute.mockResolvedValueOnce({rows:[]});
    await expect(revokeOwnSession(sessionId,otherUser)).resolves.toBe(false);
    execute.mockResolvedValueOnce({rows:[{id:sessionId}]});
    await expect(revokeOwnSession(sessionId,userId)).resolves.toBe(true);
  });
  it("AUTH-sessions-11 every revoke count concerns live, non-expired sessions only",()=>{
    const source=readFileSync("src/modules/auth/session-service.ts","utf8");
    const sections=[
      source.slice(source.indexOf("export async function revokeAllSessionsForUser("),source.indexOf("export async function listActiveSessions(")),
      source.slice(source.indexOf("export async function revokeOtherSessions("),source.indexOf("export async function revokeOwnSession(")),
      source.slice(source.indexOf("export async function revokeOwnSession(")),
    ];
    for(const section of sections){
      expect(section).toContain("AND revoked_at IS NULL");
      expect(section).toContain("AND expires_at > now()");
    }
    expect(sections[1]).toContain("AND id <> ${currentSessionId}");
    expect(sections[2]).toContain("AND user_id = ${userId}");
    expect(sections[2]).toContain("RETURNING id");
  });
  it("active-device directory preserves provider response and database failures",async()=>{
    const rows=[{id:sessionId,device_name:"Laptop",last_seen_at:new Date()}];
    execute.mockResolvedValueOnce({rows});
    await expect(listActiveSessions(userId)).resolves.toEqual(rows);
    execute.mockRejectedValueOnce(new Error("timeout"));
    await expect(listActiveSessions(userId)).rejects.toThrow("timeout");
  });
});
