import {beforeEach,describe,expect,it,vi} from "vitest";
import {PgDialect} from "drizzle-orm/pg-core";
import type {SQL} from "drizzle-orm";

const fakes=vi.hoisted(()=>({execute:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:()=>({execute:fakes.execute})}));
vi.mock("@/modules/auth/config",()=>({
 getAuthConfig:()=>({secret:"session-idle-strong-test-secret-0000000000",sessionMaxAgeSeconds:432000}),
}));
import {
 resolveSession,listActiveSessions,
 SESSION_IDLE_TIMEOUT_SECONDS,SUPER_ADMIN_IDLE_TIMEOUT_SECONDS,
 SUPER_ADMIN_ABSOLUTE_TIMEOUT_SECONDS,
} from "@/modules/auth/session-service";
const dialect=new PgDialect();
const compiled=(index:number)=>{
 const stmt=fakes.execute.mock.calls[index]?.[0] as SQL|undefined;
 if(!stmt)throw new Error("Expected session SQL statement");
 return dialect.sqlToQuery(stmt);
};
const a={session_id:"11111111-1111-4111-8111-111111111111",
 user_id:"22222222-2222-4222-8222-222222222222",
 identity_uid:"resolved-user",platform_status:"ACTIVE"};
beforeEach(()=>{vi.clearAllMocks();fakes.execute.mockResolvedValue({rows:[]});});

describe("database-enforced device session inactivity limits",()=>{
 it("sets an eight-hour ordinary limit and a thirty-minute persisted Super Admin limit",()=>{
  expect(SESSION_IDLE_TIMEOUT_SECONDS).toBe(8*3600);
  expect(SUPER_ADMIN_IDLE_TIMEOUT_SECONDS).toBe(30*60);
  expect(SUPER_ADMIN_IDLE_TIMEOUT_SECONDS).toBeLessThan(SESSION_IDLE_TIMEOUT_SECONDS);
  expect(SUPER_ADMIN_ABSOLUTE_TIMEOUT_SECONDS).toBe(8*3600);
 });
 it("checks last_seen_at, revoked_at, absolute expiry and persisted role in the atomic UPDATE",async()=>{
  fakes.execute.mockResolvedValueOnce({rows:[a]});
  await expect(resolveSession("some-valid-session")).resolves.toEqual({
   ok:true,session:{sessionId:a.session_id,userId:a.user_id,identityUid:a.identity_uid,platformStatus:"ACTIVE"},
  });
  expect(fakes.execute).toHaveBeenCalledTimes(1);
  const sql=compiled(0);
  expect(sql.sql).toContain("UPDATE identity_device_sessions AS s");
  expect(sql.sql).toContain("FOR SHARE OF u");
  expect(sql.sql).toContain("s.revoked_at IS NULL");
  expect(sql.sql).toContain("s.expires_at > clock_timestamp()");
  expect(sql.sql).toContain("s.last_seen_at > clock_timestamp()");
  expect(sql.sql).toContain("s.last_seen_at <= clock_timestamp()");
  expect(sql.sql).toContain("FROM system_roles sr");
  expect(sql.sql).toContain("sr.role = 'SUPER_ADMIN'");
  expect(sql.sql).toContain("make_interval");
  expect(sql.sql).toContain("privileged.role = 'SUPER_ADMIN'");
  expect(sql.sql).toContain("s.created_at > clock_timestamp()");
  expect(sql.params).toContain(SUPER_ADMIN_ABSOLUTE_TIMEOUT_SECONDS);
  expect(sql.params).toEqual(expect.arrayContaining([SESSION_IDLE_TIMEOUT_SECONDS,SUPER_ADMIN_IDLE_TIMEOUT_SECONDS]));
 });
 it("returns SESSION_EXPIRED on idle or future timestamp and never issues a success on fallback",async()=>{
  fakes.execute.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[{
    revoked:false,expired:true,platform_status:"ACTIVE",
  }]});
  expect(await resolveSession("old-session")).toEqual({ok:false,reason:"SESSION_EXPIRED"});
  const classified=compiled(1);
  expect(classified.sql).toContain("s.last_seen_at <= clock_timestamp()");
  expect(classified.sql).toContain("s.last_seen_at > clock_timestamp()");
  expect(classified.sql).toContain("FROM system_roles sr");
  expect(classified.sql).toContain("OR NOT");
  expect(classified.sql).toContain("privileged.role = 'SUPER_ADMIN'");
  expect(classified.params).toContain(SUPER_ADMIN_ABSOLUTE_TIMEOUT_SECONDS);
  expect(classified.params).toEqual(expect.arrayContaining([SESSION_IDLE_TIMEOUT_SECONDS,SUPER_ADMIN_IDLE_TIMEOUT_SECONDS]));
  expect(fakes.execute).toHaveBeenCalledTimes(2);
 });
 it("does not let an idle claim supersede a revoked or disabled account",async()=>{
  for(const row of [
   {revoked:true,expired:true,platform_status:"ACTIVE"},
   {revoked:false,expired:true,platform_status:"DISABLED"},
  ]){
   fakes.execute.mockReset();
   fakes.execute.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[row]});
   await expect(resolveSession("revoked")).resolves.toEqual({ok:false,reason:"SESSION_REVOKED"});
  }
 });
 it("does not list idle devices as active on the account security screen",async()=>{
  fakes.execute.mockResolvedValueOnce({rows:[{id:a.session_id}]});
  expect(await listActiveSessions(a.user_id)).toEqual([{id:a.session_id}]);
  const query=compiled(0);
  expect(query.sql).toContain("s.user_id");
  expect(query.sql).toContain("s.last_seen_at > clock_timestamp()");
  expect(query.sql).toContain("s.last_seen_at <= clock_timestamp()");
  expect(query.sql).toContain("FROM system_roles sr");
  expect(query.sql).toContain("privileged.role = 'SUPER_ADMIN'");
  expect(query.params).toContain(SUPER_ADMIN_ABSOLUTE_TIMEOUT_SECONDS);
  expect(query.params).toContain(a.user_id);
  expect(query.params).toEqual(expect.arrayContaining([SESSION_IDLE_TIMEOUT_SECONDS,SUPER_ADMIN_IDLE_TIMEOUT_SECONDS]));
 });
 it("fails closed if the backing database fails during authentication",async()=>{
  fakes.execute.mockRejectedValueOnce(new Error("SESSION_DB_DOWN"));
  await expect(resolveSession("token")).rejects.toThrow("SESSION_DB_DOWN");
  expect(fakes.execute).toHaveBeenCalledOnce();
 });
 it("unknown credentials remain invalid; classification never grants a session",async()=>{
  fakes.execute.mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[]});
  await expect(resolveSession("unknown")).resolves.toEqual({ok:false,reason:"SESSION_INVALID"});
 });
});
