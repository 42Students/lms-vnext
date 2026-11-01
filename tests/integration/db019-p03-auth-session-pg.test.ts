import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool, type PoolClient } from "pg";
import { randomUUID } from "node:crypto";
import { sessionDigest } from "@/modules/auth/crypto";
import { resetAuthConfigForTests } from "@/modules/auth/config";
import {
  createSession, resolveSession, revokeOwnSession, revokeOtherSessions,
  revokeAllOwnSessions, listActiveSessions,
} from "@/modules/auth/session-service";
import { closeDatabaseConnection } from "@/db/client";
import { resolveRequestContext } from "@/modules/identity/context-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

/**
 * DB19-P03: real auth producer -> registered PG17 persisted digest -> actual
 * session resolver/revoker. Runs only on an explicitly isolated and prepared
 * disposable database. It does not migrate or accept historical JWTs.
 */
const enabled = process.env["DB019_P03_ISOLATED_TEST_DATABASE"] === "1"
  && process.env["DB03_ISOLATED_TEST_DATABASE"] === "1"
  && Boolean(process.env["TEST_DATABASE_URL"])
  && process.env["DATABASE_URL"] === process.env["TEST_DATABASE_URL"];
const pool = enabled ? new Pool({connectionString:process.env["TEST_DATABASE_URL"],max:5}) : null;
const originalSecret=process.env["AUTH_SECRET"];
const testSecret="db019-p03-registered-session-acceptance-test-secret-2026";
const createdDigests:string[]=[];
const owner=SEED_IDS.facultyUser;
const other=SEED_IDS.collegeAdminUser;

async function freshSession() {
  const created=await createSession(owner,{deviceName:"DB19 P03 test device"});
  const digest=sessionDigest(testSecret,created.token);
  createdDigests.push(digest);
  return {...created,digest};
}

async function waitForResolverBlockedBy(blocker:PoolClient,timeoutMs=7000) {
  const pidResult=await blocker.query<{pid:number}>("select pg_backend_pid() as pid");
  const pid=pidResult.rows[0]!.pid;
  const deadline=Date.now()+timeoutMs;
  while(Date.now()<deadline) {
    const waiting=await pool!.query<{waiting:number}>(`
      select count(*)::int as waiting from pg_stat_activity
       where pid<>$1 and $1=any(pg_blocking_pids(pid))
         and query like '%UPDATE identity_device_sessions AS s%'
    `,[pid]);
    if(waiting.rows[0]!.waiting>0)return true;
    await new Promise(resolve=>setTimeout(resolve,50));
  }
  return false;
}

describe.skipIf(!enabled)("DB19-P03 registered identity session and revocation boundaries",()=>{
  beforeAll(async()=>{
    assertDb018DisposableTarget(process.env,{serviceBound:true});
    if(!pool)throw new Error("Disposable DB19-P03 pool unavailable");
    process.env["AUTH_SECRET"]=testSecret;
    resetAuthConfigForTests();
    const seeded=await pool.query<{id:string}>(
      "select id from users where id=any($1::uuid[]) and platform_status='ACTIVE'",
      [[owner,other]],
    );
    expect(seeded.rows).toHaveLength(2);
  });
  afterAll(async()=>{
    if(pool && createdDigests.length){
      await pool.query("delete from identity_device_sessions where credential_digest=any($1::text[])",[createdDigests]);
    }
    await pool?.end();
    await closeDatabaseConnection();
    if(originalSecret===undefined)delete process.env["AUTH_SECRET"];
    else process.env["AUTH_SECRET"]=originalSecret;
    resetAuthConfigForTests();
  });

  it("persists a keyed digest, not bearer token; resolves only the active user",async()=>{
    const session=await freshSession();
    const stored=await pool!.query<{
      credential_digest:string;user_id:string;revoked_at:string|null;
    }>("select credential_digest,user_id,revoked_at from identity_device_sessions where credential_digest=$1",[session.digest]);
    expect(stored.rows).toHaveLength(1);
    expect(stored.rows[0]).toMatchObject({
      credential_digest:session.digest,user_id:owner,revoked_at:null,
    });
    expect(JSON.stringify(stored.rows)).not.toContain(session.token);
    const active=await resolveSession(session.token);
    expect(active.ok).toBe(true);
    if(active.ok)expect(active.session.userId).toBe(owner);
    expect(await resolveSession("unknown-"+randomUUID())).toEqual({ok:false,reason:"SESSION_INVALID"});
    expect(await revokeOwnSession(
      (await pool!.query<{id:string}>("select id from identity_device_sessions where credential_digest=$1",[session.digest])).rows[0]!.id,
      other,
    )).toBe(false);
    expect((await resolveSession(session.token)).ok).toBe(true);
  });

  it("sign out other devices preserves caller, denies both foreign IDOR and repeat revoke",async()=>{
    const active=await freshSession(),old=await freshSession();
    const rows=await pool!.query<{id:string;credential_digest:string}>(
      "select id,credential_digest from identity_device_sessions where credential_digest=any($1::text[])",
      [[active.digest,old.digest]],
    );
    const activeId=rows.rows.find(x=>x.credential_digest===active.digest)!.id;
    const oldId=rows.rows.find(x=>x.credential_digest===old.digest)!.id;
    expect(await revokeOwnSession(oldId,other)).toBe(false);
    expect(await revokeOtherSessions(owner,activeId)).toBeGreaterThanOrEqual(1);
    expect((await resolveSession(active.token)).ok).toBe(true);
    expect(await resolveSession(old.token)).toEqual({ok:false,reason:"SESSION_REVOKED"});
    expect(await revokeOwnSession(oldId,owner)).toBe(false);
    const visible=await listActiveSessions(other);
    expect(visible.some(s=>s.id===activeId||s.id===oldId)).toBe(false);
    expect(await revokeAllOwnSessions(owner)).toBeGreaterThanOrEqual(1);
    expect(await resolveSession(active.token)).toEqual({ok:false,reason:"SESSION_REVOKED"});
  });

  it("expired credential is denied and cannot refresh last-seen heartbeat",async()=>{
    const session=await freshSession();
    const changed=await pool!.query<{last_seen_at:Date}>(`
      update identity_device_sessions
         set created_at=now()-interval '10 days',
             last_seen_at=now()-interval '2 minutes',
             expires_at=now()-interval '1 second'
       where credential_digest=$1
       returning last_seen_at
    `,[session.digest]);
    expect(changed.rows).toHaveLength(1);
    const previous=changed.rows[0]!.last_seen_at.getTime();
    expect(await resolveSession(session.token)).toEqual({ok:false,reason:"SESSION_EXPIRED"});
    const later=await pool!.query<{last_seen_at:Date}>(
      "select last_seen_at from identity_device_sessions where credential_digest=$1",[session.digest],
    );
    expect(later.rows[0]!.last_seen_at.getTime()).toBe(previous);
  });

  it("a committed revoke beats a blocked simultaneous login heartbeat (real two-client race)",async()=>{
    const session=await freshSession();
    const old=await pool!.query<{last_seen_at:Date}>(`
      update identity_device_sessions set
         created_at=now()-interval '1 day',
         last_seen_at=now()-interval '2 minutes'
       where credential_digest=$1 returning last_seen_at
    `,[session.digest]);
    const blocker=await pool!.connect();
    let transaction=false;
    let pending:Promise<Awaited<ReturnType<typeof resolveSession>>>|undefined;
    try {
      await blocker.query("begin");transaction=true;
      const blocked=await blocker.query(`
        update identity_device_sessions
           set revoked_at=clock_timestamp(),revoked_by_user_id=$2,revocation_reason='DB019_P03_RACE'
         where credential_digest=$1 and revoked_at is null returning id
      `,[session.digest,owner]);
      expect(blocked.rowCount).toBe(1);
      pending=resolveSession(session.token);
      expect(await waitForResolverBlockedBy(blocker)).toBe(true);
      await blocker.query("commit");transaction=false;
      expect(await pending).toEqual({ok:false,reason:"SESSION_REVOKED"});
      const result=await pool!.query<{last_seen_at:Date;revoked_at:Date|null}>(
        "select last_seen_at,revoked_at from identity_device_sessions where credential_digest=$1",
        [session.digest],
      );
      expect(result.rows[0]!.revoked_at).not.toBeNull();
      expect(result.rows[0]!.last_seen_at.getTime()).toBe(old.rows[0]!.last_seen_at.getTime());
    } finally {
      if(transaction)await blocker.query("rollback");
      if(pending)await pending.catch(()=>undefined);
      blocker.release();
    }
  });

  it("a global platform disable races and defeats a pending session heartbeat",async()=>{
    const session=await freshSession();
    const old=await pool!.query<{last_seen_at:Date}>(`
      update identity_device_sessions set
         created_at=now()-interval '1 day',
         last_seen_at=now()-interval '2 minutes'
       where credential_digest=$1 returning last_seen_at
    `,[session.digest]);
    const blocker=await pool!.connect();
    let transaction=false;
    let pending:Promise<Awaited<ReturnType<typeof resolveSession>>>|undefined;
    try {
      await blocker.query("begin"); transaction=true;
      const changed=await blocker.query(
        "update users set platform_status='DISABLED' where id=$1 and platform_status='ACTIVE' returning id",
        [owner],
      );
      expect(changed.rowCount).toBe(1);
      pending=resolveSession(session.token);
      expect(await waitForResolverBlockedBy(blocker)).toBe(true);
      await blocker.query("commit");transaction=false;
      // A disabled global user is a revoked credential even if the device
      // itself has no revoked_at: no short-lived authorization grant escapes.
      expect(await pending).toEqual({ok:false,reason:"SESSION_REVOKED"});
      const after=await pool!.query<{last_seen_at:Date}>(
        "select last_seen_at from identity_device_sessions where credential_digest=$1",
        [session.digest],
      );
      expect(after.rows[0]!.last_seen_at.getTime()).toBe(old.rows[0]!.last_seen_at.getTime());
    } finally {
      if(transaction)await blocker.query("rollback");
      if(pending)await pending.catch(()=>undefined);
      blocker.release();
      // Always restore seeded global identity state in this disposable gate,
      // including when a race assertion fails before the commit.
      await pool!.query("update users set platform_status='ACTIVE' where id=$1",[owner]);
    }
  });

  it("a live global session cannot reuse a foreign or suspended college membership",async()=>{
    const session=await freshSession();
    const resolved=await resolveSession(session.token);
    expect(resolved.ok).toBe(true);
    if(!resolved.ok)throw new Error("The isolated seeded faculty must be able to sign in");
    const identityUid=resolved.session.identityUid;
    const permitted=await resolveRequestContext({
      identityUid,activeMembershipId:SEED_IDS.facultyCollegeAMembership,activeRole:"FACULTY",
    });
    expect(permitted.user.id).toBe(owner);
    expect(permitted.membership?.collegeId).toBe(SEED_IDS.collegeA);
    expect(permitted.membership?.roles).toContain("FACULTY");
    // A UUID for another human's college membership must not be accepted
    // simply because the caller has a currently valid device session.
    await expect(resolveRequestContext({
      identityUid,activeMembershipId:SEED_IDS.learnerCollegeAMembership,activeRole:"LEARNER",
    })).rejects.toMatchObject({code:"MEMBERSHIP_NOT_FOUND"});
    try {
      const suspended=await pool!.query(
        "update college_memberships set status='SUSPENDED',suspended_at=clock_timestamp() where id=$1 and status='ACTIVE' returning id",
        [SEED_IDS.facultyCollegeAMembership],
      );
      expect(suspended.rowCount).toBe(1);
      // The shared device session remains valid, but its selected college
      // must fail closed. This is intentionally not a global account disable.
      expect((await resolveSession(session.token)).ok).toBe(true);
      await expect(resolveRequestContext({
        identityUid,activeMembershipId:SEED_IDS.facultyCollegeAMembership,activeRole:"FACULTY",
      })).rejects.toMatchObject({code:"MEMBERSHIP_NOT_ACTIVE"});
      const otherCollege=await resolveRequestContext({
        identityUid,activeMembershipId:SEED_IDS.facultyCollegeBMembership,activeRole:"FACULTY",
      });
      expect(otherCollege.membership?.collegeId).toBe(SEED_IDS.collegeB);
    } finally {
      await pool!.query(
        "update college_memberships set status='ACTIVE',suspended_at=null where id=$1",
        [SEED_IDS.facultyCollegeAMembership],
      );
    }
  });

  it("registered schema rejects non-hex session digests and revoker-without-revocation",async()=>{
    const session=await freshSession();
    await expect(pool!.query(
      "update identity_device_sessions set credential_digest=$2 where credential_digest=$1",
      [session.digest,"not-a-keyed-digest"],
    )).rejects.toMatchObject({code:"23514"});
    await expect(pool!.query(
      "update identity_device_sessions set revoked_by_user_id=$2 where credential_digest=$1",
      [session.digest,owner],
    )).rejects.toMatchObject({code:"23514"});
    expect((await resolveSession(session.token)).ok).toBe(true);
  });
});
