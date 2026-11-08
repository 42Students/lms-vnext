import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import { generateToken, sessionDigest } from "@/modules/auth/crypto";
import { getAuthConfig, resetAuthConfigForTests } from "@/modules/auth/config";
import {
  resolveSession, listActiveSessions,
  SESSION_IDLE_TIMEOUT_SECONDS, SUPER_ADMIN_IDLE_TIMEOUT_SECONDS,
  SUPER_ADMIN_ABSOLUTE_TIMEOUT_SECONDS,
} from "@/modules/auth/session-service";

/**
 * DB-004: registered-migration PostgreSQL acceptance.
 * The credential resolver must lose to a revocation that holds the row lock,
 * not merely discard a heartbeat while returning the old authenticated row.
 * Both env values must identify the same disposable fixture database.
 */
const url = process.env.TEST_DATABASE_URL;
if (!url || process.env.DATABASE_URL !== url) {
  throw new Error("DB-004 atomic auth requires DATABASE_URL === TEST_DATABASE_URL");
}
const pool = new Pool({ connectionString: url, max: 3 });
const priorSecret = process.env.AUTH_SECRET;
const localSecret = "db004-atomic-session-authorization-" + randomUUID();

beforeAll(() => {
  process.env.AUTH_SECRET = localSecret;
  resetAuthConfigForTests();
});

afterAll(async () => {
  if (priorSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = priorSecret;
  resetAuthConfigForTests();
  await closeDatabaseConnection();
  await pool.end();
});

async function withDevice(run: (input: {userId: string; sessionId: string; token: string}) => Promise<void>) {
  const userId = randomUUID(), sessionId = randomUUID();
  const token = generateToken();
  try {
    await pool.query(
      "insert into users (id, identity_uid, platform_status) values ($1,$2,'ACTIVE')",
      [userId,"db004-atomic-"+userId],
    );
    await pool.query(`
      insert into identity_device_sessions
        (id, user_id, credential_digest, created_at, last_seen_at, expires_at)
      values ($1,$2,$3,clock_timestamp()-interval '2 minutes',
              clock_timestamp()-interval '2 minutes',clock_timestamp()+interval '1 hour')`,
      [sessionId,userId,sessionDigest(getAuthConfig().secret,token)],
    );
    await run({userId,sessionId,token});
  } finally {
    await pool.query("delete from identity_device_sessions where user_id = $1",[userId]);
    await pool.query("delete from system_roles where user_id = $1",[userId]);
    await pool.query("delete from users where id = $1",[userId]);
  }
}

describe("DB-004 atomic device authorization and revocation", () => {
  it("authenticates only a current active device, with a minute-throttled heartbeat", async () => {
    await withDevice(async ({userId,sessionId,token}) => {
      const first=await resolveSession(token);
      expect(first).toEqual({ok:true,session:{
        sessionId,userId,identityUid:"db004-atomic-"+userId,platformStatus:"ACTIVE",
      }});
      const seen=await pool.query<{last_seen_at:Date}>(
        "select last_seen_at from identity_device_sessions where id=$1",[sessionId]);
      expect(seen.rows[0]!.last_seen_at.getTime()).toBeGreaterThan(Date.now()-30_000);
      await expect(resolveSession(token)).resolves.toEqual(first);
      const again=await pool.query<{last_seen_at:Date}>(
        "select last_seen_at from identity_device_sessions where id=$1",[sessionId]);
      expect(again.rows[0]!.last_seen_at.getTime()).toBe(seen.rows[0]!.last_seen_at.getTime());

      await pool.query("update users set platform_status='DISABLED' where id=$1",[userId]);
      await expect(resolveSession(token)).resolves.toEqual({ok:false,reason:"SESSION_REVOKED"});
    });
  });

  it("DB-SEC-IDLE-01 denies an eight-hour idle token before any heartbeat, despite valid absolute expiry", async () => {
    expect(SESSION_IDLE_TIMEOUT_SECONDS).toBe(8 * 3600);
    await withDevice(async ({userId,sessionId,token}) => {
      const older=await pool.query<{last_seen_at:Date}>(`
        update identity_device_sessions
           set created_at=clock_timestamp()-interval '10 hours',
               last_seen_at=clock_timestamp()-interval '9 hours'
         where id=$1 returning last_seen_at`,[sessionId]);
      const lastSeen=older.rows[0]!.last_seen_at.getTime();
      expect(await resolveSession(token)).toEqual({ok:false,reason:"SESSION_EXPIRED"});
      expect(await listActiveSessions(userId)).toEqual([]);
      const after=await pool.query<{last_seen_at:Date}>(
        "select last_seen_at from identity_device_sessions where id=$1",[sessionId]);
      expect(after.rows[0]!.last_seen_at.getTime()).toBe(lastSeen);
      // Recovering a device needs a NEW login, never a read-only refresh.
      await expect(resolveSession(token)).resolves.toEqual({ok:false,reason:"SESSION_EXPIRED"});
    });
  });

  it("DB-SEC-IDLE-02 enforces the shorter Super Admin timeout independent of chosen college workspace", async () => {
    expect(SUPER_ADMIN_IDLE_TIMEOUT_SECONDS).toBe(30 * 60);
    await withDevice(async ({userId,sessionId,token}) => {
      await pool.query("insert into system_roles(user_id,role) values($1,'SUPER_ADMIN')",[userId]);
      await pool.query(`
        update identity_device_sessions
           set created_at=clock_timestamp()-interval '2 hours',
               last_seen_at=clock_timestamp()-interval '31 minutes'
         where id=$1`,[sessionId]);
      expect(await resolveSession(token)).toEqual({ok:false,reason:"SESSION_EXPIRED"});
      expect(await listActiveSessions(userId)).toEqual([]);
      // Still-active sessions inside 30m retain their normal operations.
      await pool.query(`
        update identity_device_sessions set last_seen_at=clock_timestamp()-interval '29 minutes'
         where id=$1`,[sessionId]);
      expect((await resolveSession(token)).ok).toBe(true);
      // Revoking the Super Admin role does not make a stale credential fresh.
      await pool.query("delete from system_roles where user_id=$1",[userId]);
      await pool.query(`
        update identity_device_sessions set created_at=clock_timestamp()-interval '7 hours 1 minute',
               last_seen_at=clock_timestamp()-interval '7 hours'
         where id=$1`,[sessionId]);
      expect((await resolveSession(token)).ok).toBe(true);
    });
  });

  it("DB-SEC-IDLE-04 expires a continuously active Super Admin session after eight hours absolute",async()=>{
    expect(SUPER_ADMIN_ABSOLUTE_TIMEOUT_SECONDS).toBe(8*3600);
    await withDevice(async ({userId,sessionId,token})=>{
      await pool.query("insert into system_roles(user_id,role) values($1,'SUPER_ADMIN')",[userId]);
      const saved=await pool.query<{last_seen_at:Date}>(`
        update identity_device_sessions
           set created_at=clock_timestamp()-interval '9 hours',
               last_seen_at=clock_timestamp()-interval '1 minute'
         where id=$1 returning last_seen_at`,[sessionId]);
      const heartbeat=saved.rows[0]!.last_seen_at.getTime();
      expect(await resolveSession(token)).toEqual({ok:false,reason:"SESSION_EXPIRED"});
      expect(await listActiveSessions(userId)).toEqual([]);
      const after=await pool.query<{last_seen_at:Date}>(
        "select last_seen_at from identity_device_sessions where id=$1",[sessionId]);
      expect(after.rows[0]!.last_seen_at.getTime()).toBe(heartbeat);
      await pool.query(`
        update identity_device_sessions
           set created_at=clock_timestamp()-interval '7 hours'
         where id=$1`,[sessionId]);
      expect((await resolveSession(token)).ok).toBe(true);
    });
  });

  it("DB-SEC-IDLE-03 rejects future device heartbeats, and won't classify them as valid", async () => {
    await withDevice(async ({userId,sessionId,token}) => {
      const last=await pool.query<{last_seen_at:Date}>(`
        update identity_device_sessions
           set last_seen_at=clock_timestamp()+interval '6 hours'
         where id=$1 returning last_seen_at`,[sessionId]);
      expect(await resolveSession(token)).toEqual({ok:false,reason:"SESSION_EXPIRED"});
      expect(await listActiveSessions(userId)).toEqual([]);
      const current=await pool.query<{last_seen_at:Date}>(
        "select last_seen_at from identity_device_sessions where id=$1",[sessionId]);
      expect(current.rows[0]!.last_seen_at.getTime()).toBe(last.rows[0]!.last_seen_at.getTime());
    });
  });

  it("rejects a session whose revocation commits while authorization is blocked", async () => {
    await withDevice(async ({userId,sessionId,token}) => {
      const revoker=await pool.connect();
      let inTransaction=false;
      try {
        await revoker.query("BEGIN");
        inTransaction=true;
        await revoker.query(`
          update identity_device_sessions
             set revoked_at=clock_timestamp(),revoked_by_user_id=$2,
                 revocation_reason='SECURITY_REVOKE'
           where id=$1`,[sessionId,userId]);
        const pending=resolveSession(token);
        // Allow the authentication SQL to reach the locked device row.
        await new Promise(resolve=>setTimeout(resolve,100));
        await revoker.query("COMMIT");
        inTransaction=false;
        expect(await pending).toEqual({ok:false,reason:"SESSION_REVOKED"});
        await expect(resolveSession(token)).resolves.toEqual({ok:false,reason:"SESSION_REVOKED"});
      } finally {
        if(inTransaction)await revoker.query("ROLLBACK");
        revoker.release();
      }
    });
  });

  it("never treats an expired device as authenticated", async () => {
    await withDevice(async ({sessionId,token}) => {
      await pool.query(`
        update identity_device_sessions
           set expires_at=clock_timestamp()-interval '1 second'
         where id=$1`,[sessionId]);
      await expect(resolveSession(token)).resolves.toEqual({ok:false,reason:"SESSION_EXPIRED"});
    });
  });
});
