import {readFileSync} from "node:fs";
import {afterAll,describe,expect,it} from "vitest";
import {Pool} from "pg";

/** DB-004 technical retirement witness, NOT product/security approval:
 * no historical raw password, JWT, refresh token, login-user or cross-host
 * bearer handoff table is registered into first-party vNext Postgres.
 */
const url=process.env.TEST_DATABASE_URL;
if(!url||process.env.DATABASE_URL!==url)
 throw new Error("DB004 retirement witness requires isolated matching disposable PG URLs");
const pool=new Pool({connectionString:url,max:1});
afterAll(async()=>{await pool.end();});
const candidates=[
 ...["id","created_at","updated_at","is_deleted","token","access_token",
  "refresh_token","expires_at","used"].map(name=>"auth_handoff_token."+name),
 ...["id","created_at","is_deleted","updated_at","token"]
  .map(name=>"auth_token."+name),
 ...["id","created_at","is_deleted","updated_at","password","user_name"]
  .map(name=>"login_user."+name),
 "user.password",
];
describe("DB-004 retired credential schema negative assertions",()=>{
 it("proves 21 canonical source field candidates are explicitly unapproved and have no raw credential authority",async()=>{
  const ledger=JSON.parse(readFileSync("docs/planning/db004-current-owner-evidence.json","utf8")) as {
   rows:{legacyField:string;runtimeSemanticsVerified:boolean;physicalVerified:boolean;
    retirementImplementationVerified?:boolean;retirementApproved?:boolean}[];
  };
  expect(candidates).toHaveLength(21);
  expect(new Set(candidates).size).toBe(21);
  for(const field of candidates){
   const entry=ledger.rows.find(row=>row.legacyField===field);
   expect(entry,field).toBeDefined();
   expect(entry?.runtimeSemanticsVerified).toBe(false);
   expect(entry?.physicalVerified).toBe(false);
   expect(entry?.retirementImplementationVerified).toBe(true);
   expect(entry?.retirementApproved).toBe(false);
  }
  const result=await pool.query<{
   auth_token:string|null;login_user:string|null;handoff:string|null;
   attempted_handoff:string|null;
  }>(`select
      to_regclass('public.auth_token')::text as auth_token,
      to_regclass('public.login_user')::text as login_user,
      to_regclass('public.auth_handoff_token')::text as handoff,
      to_regclass('public.identity_auth_handoffs')::text as attempted_handoff`);
  expect(result.rows[0]).toEqual({
   auth_token:null,login_user:null,handoff:null,attempted_handoff:null,
  });
  const columns=await pool.query<{table_name:string;column_name:string}>(`
   select table_name,column_name from information_schema.columns
    where table_schema='public'
      and table_name=any($1::text[])
      and column_name=any($2::text[])
  `,[["users","identity_auth_attempts","identity_device_sessions",
       "identity_preuser_challenges","identity_email_verification_links"],
      ["password","password_hash","access_token","refresh_token","token_jti",
       "raw_otp","otp","firebase_id_token","jwt"]]);
  expect(columns.rows).toEqual([]);
  const session=await pool.query<{present:boolean}>(`
   select exists(select 1 from information_schema.columns
    where table_schema='public'
      and table_name='identity_device_sessions'
      and column_name='credential_digest') as present`);
  expect(session.rows[0]?.present).toBe(true);
  const proof=await pool.query<{present:boolean}>(`
   select exists(select 1 from information_schema.columns
    where table_schema='public'
      and table_name='identity_auth_attempts'
      and column_name='sms_code_mac') as present`);
  expect(proof.rows[0]?.present).toBe(true);
 });
 it("retired cross-host tokens are redirected to first-party reauthentication rather than forwarded",()=>{
  const route=readFileSync("src/app/auth/handoff/page.tsx","utf8");
  expect(route).toContain('redirect("/login?auth=handoff-retired"');
  expect(route).not.toMatch(/redeemToken|consumeHandoffToken|setAuthCookie/);
  const source=readFileSync("src/modules/auth/login-service.ts","utf8");
  expect(source).toContain("consumeAttempt(");
  expect(source).toContain("sessionDigest(");
 });
});
