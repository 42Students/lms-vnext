import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import type { LoginRepository } from "@/modules/auth/login-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

/** Registered DB-004 auth: no disabled or unrelated user can consume an OTP
 * into a device session, including an account disabled after verification.
 * Uses a disposable PostgreSQL database, never a shared one.
 */
const url=process.env.TEST_DATABASE_URL;
if(!url||process.env.DATABASE_URL!==url)
  throw new Error("DB01 OTP consume requires DATABASE_URL === TEST_DATABASE_URL");
const pool=new Pool({connectionString:url,max:2});
let repository:LoginRepository;
let closeDb:()=>Promise<void>;
beforeAll(async()=>{
  repository=(await import("@/modules/auth/login-repository")).drizzleLoginRepository;
  closeDb=(await import("@/db/client")).closeDatabaseConnection;
});
afterAll(async()=>{
  await pool.end();
  await closeDb();
});

async function withChallenge(run:(input:{userId:string;attemptId:string})=>Promise<void>){
  const userId=randomUUID(),attemptId=randomUUID(),membershipId=randomUUID();
  try{
    await pool.query(
      "insert into users (id,identity_uid,platform_status) values ($1,$2,'ACTIVE')",
      [userId,"db004-otp-consume-"+userId],
    );
    await pool.query(
      "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
      [membershipId,userId,SEED_IDS.collegeA]);
    await pool.query(
      "insert into membership_roles(membership_id,role) values($1,'LEARNER')",[membershipId]);
    expect(await repository.createAttempt({
      id:attemptId,userId,collegeId:null,
      contactFingerprint:randomUUID().replaceAll("-","").padEnd(64,"0"),
      smsCodeMac:"a".repeat(64),emailCodeMac:null,
      // identity_auth_attempts.ip_tag is varchar(24); use a valid opaque test address tag.
      ipTag:"otp-"+userId.slice(0,8),
      rateLimit:{windowMinutes:10,perContactAndAddress:5,perContact:8,perAddress:20},
    })).toBe(true);
    expect(await repository.reserveVerification(attemptId)).toBe(true);
    await run({userId,attemptId});
  }finally{
    await pool.query("delete from identity_device_sessions where user_id=$1",[userId]);
    await pool.query("delete from identity_auth_attempts where user_id=$1",[userId]);
    await pool.query("delete from membership_roles where membership_id=$1",[membershipId]);
    await pool.query("delete from college_memberships where id=$1",[membershipId]);
    await pool.query("delete from users where id=$1",[userId]);
  }
}

async function withScopedChallenge(run:(input:{userId:string;attemptId:string;membershipId:string})=>Promise<void>){
  const userId=randomUUID(),attemptId=randomUUID(),membershipId=randomUUID();
  try{
    await pool.query(
      "insert into users(id,identity_uid,platform_status) values($1,$2,'ACTIVE')",
      [userId,"db004-scoped-otp-"+userId],
    );
    await pool.query(
      "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
      [membershipId,userId,SEED_IDS.collegeA],
    );
    await pool.query(
      "insert into membership_roles(membership_id,role) values($1,'LEARNER')",
      [membershipId],
    );
    expect(await repository.createAttempt({
      id:attemptId,userId,collegeId:SEED_IDS.collegeA,
      contactFingerprint:randomUUID().replaceAll("-","").padEnd(64,"0"),
      smsCodeMac:"a".repeat(64),emailCodeMac:null,
      ipTag:"scope-"+userId.slice(0,8),
      rateLimit:{windowMinutes:10,perContactAndAddress:5,perContact:8,perAddress:20},
    })).toBe(true);
    expect(await repository.reserveVerification(attemptId)).toBe(true);
    await run({userId,attemptId,membershipId});
  }finally{
    await pool.query("delete from identity_device_sessions where user_id=$1",[userId]);
    await pool.query("delete from identity_auth_attempts where user_id=$1",[userId]);
    await pool.query("delete from membership_roles where membership_id=$1",[membershipId]);
    await pool.query("delete from college_memberships where id=$1",[membershipId]);
    await pool.query("delete from users where id=$1",[userId]);
  }
}
const device=()=>({digest:randomUUID().replaceAll("-","").padEnd(64,"0"),maxAgeSeconds:3600});

describe("DB-004 tenant authorization is rechecked by final OTP consume",()=>{
  it("mints the device only for a live scoped membership with a held role",async()=>{
    await withScopedChallenge(async({userId,attemptId})=>{
      expect(await repository.consumeAttempt(attemptId,userId,device())).toBe(true);
      expect(await repository.consumeAttempt(attemptId,userId,device())).toBe(false);
    });
  });
  it("does not consume verified code after the target membership is suspended",async()=>{
    await withScopedChallenge(async({userId,attemptId,membershipId})=>{
      await pool.query(
        "update college_memberships set status='SUSPENDED',suspended_at=now() where id=$1",
        [membershipId],
      );
      expect(await repository.consumeAttempt(attemptId,userId,device())).toBe(false);
      const row=await pool.query<{used_at:Date|null}>(
        "select used_at from identity_auth_attempts where id=$1",[attemptId],
      );
      expect(row.rows[0]?.used_at).toBeNull();
      const devices=await pool.query(
        "select id from identity_device_sessions where user_id=$1",[userId]);
      expect(devices.rowCount).toBe(0);
    });
  });
  it("does not mint a scoped device after the last role grant is revoked",async()=>{
    await withScopedChallenge(async({userId,attemptId,membershipId})=>{
      await pool.query("delete from membership_roles where membership_id=$1",[membershipId]);
      expect(await repository.consumeAttempt(attemptId,userId,device())).toBe(false);
      const devices=await pool.query(
        "select id from identity_device_sessions where user_id=$1",[userId]);
      expect(devices.rowCount).toBe(0);
    });
  });
});

describe("DB-004 platform-host OTP entitlement is rechecked atomically",()=>{
  it("refuses a login after the last global-eligible role is removed",async()=>{
    await withChallenge(async({userId,attemptId})=>{
      const membership=await pool.query<{id:string}>(
        "select id from college_memberships where user_id=$1",[userId]);
      await pool.query("delete from membership_roles where membership_id=$1",
        [membership.rows[0]!.id]);
      expect(await repository.consumeAttempt(attemptId,userId,device())).toBe(false);
      const attempts=await pool.query<{used_at:Date|null}>(
        "select used_at from identity_auth_attempts where id=$1",[attemptId]);
      expect(attempts.rows[0]?.used_at).toBeNull();
      const devices=await pool.query(
        "select id from identity_device_sessions where user_id=$1",[userId]);
      expect(devices.rowCount).toBe(0);
    });
  });
  it("refuses a login after the last platform membership is suspended",async()=>{
    await withChallenge(async({userId,attemptId})=>{
      await pool.query(
        "update college_memberships set status='SUSPENDED',suspended_at=clock_timestamp() where user_id=$1",
        [userId]);
      expect(await repository.consumeAttempt(attemptId,userId,device())).toBe(false);
      const devices=await pool.query(
        "select id from identity_device_sessions where user_id=$1",[userId]);
      expect(devices.rowCount).toBe(0);
    });
  });
});

describe("DB-004 OTP consume and account-disable serialization",()=>{
  it("accepts an active account once and rejects replay without creating another session",async()=>{
    await withChallenge(async({userId,attemptId})=>{
      expect(await repository.consumeAttempt(attemptId,userId,device())).toBe(true);
      expect(await repository.consumeAttempt(attemptId,userId,device())).toBe(false);
      const count=await pool.query<{count:string}>(
        "select count(*)::text as count from identity_device_sessions where user_id=$1",[userId]);
      expect(Number(count.rows[0]?.count)).toBe(1);
    });
  });

  it("rejects a disabled user without consuming their challenge or issuing a device",async()=>{
    await withChallenge(async({userId,attemptId})=>{
      await pool.query("update users set platform_status='DISABLED' where id=$1",[userId]);
      expect(await repository.consumeAttempt(attemptId,userId,device())).toBe(false);
      const attempts=await pool.query<{used_at:Date|null}>(
        "select used_at from identity_auth_attempts where id=$1",[attemptId]);
      expect(attempts.rows[0]?.used_at).toBeNull();
      const devices=await pool.query(
        "select id from identity_device_sessions where user_id=$1",[userId]);
      expect(devices.rowCount).toBe(0);
    });
  });

  it("refuses an attempt belonging to another identity",async()=>{
    await withChallenge(async({userId,attemptId})=>{
      expect(await repository.consumeAttempt(attemptId,randomUUID(),device())).toBe(false);
      const devices=await pool.query("select id from identity_device_sessions where user_id=$1",[userId]);
      expect(devices.rowCount).toBe(0);
    });
  });

  it("loses to account disablement committed while the user row is locked",async()=>{
    await withChallenge(async({userId,attemptId})=>{
      const disabler=await pool.connect();
      let open=false;
      try{
        await disabler.query("begin");open=true;
        await disabler.query("update users set platform_status='DISABLED' where id=$1",[userId]);
        const pending=repository.consumeAttempt(attemptId,userId,device());
        await new Promise(resolve=>setTimeout(resolve,75));
        await disabler.query("commit");open=false;
        expect(await pending).toBe(false);
      }finally{
        if(open)await disabler.query("rollback");
        disabler.release();
      }
      const count=await pool.query<{count:string}>(
        "select count(*)::text as count from identity_device_sessions where user_id=$1",[userId]);
      expect(Number(count.rows[0]?.count)).toBe(0);
    });
  });
});
