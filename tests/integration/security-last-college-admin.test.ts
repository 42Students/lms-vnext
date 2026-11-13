import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { closeDatabaseConnection } from "@/db/client";
import { drizzlePeopleRepository } from "@/modules/people/repository";
import {changePlatformAccountStatus} from "@/modules/people/super-admin-platform-account-service";
import type { RequestContext } from "@/modules/identity/context";
import type { MembershipMutationContext } from "@/modules/people/membership-service";

/**
 * #81: real repository mutations on disposable PostgreSQL 17.
 * No live/dev tenant can be targeted by these fixtures.
 */
const url = process.env.TEST_DATABASE_URL;
if (!url || url !== process.env.DATABASE_URL) {
  throw new Error("Last College Admin tests require TEST_DATABASE_URL === DATABASE_URL");
}
const target = new URL(url);
const dbName = decodeURIComponent(target.pathname.replace(/^\//, ""));
if (!["postgresql:", "postgres:"].includes(target.protocol) ||
    !/^(?:test_[a-z0-9_]+|[a-z0-9_]+_test(?:_[a-z0-9]+)*)$/i.test(dbName)) {
  throw new Error("Last College Admin tests require an explicitly named disposable test database");
}
if (!["localhost", "127.0.0.1", "[::1]", "::1"].includes(target.hostname.toLowerCase()) &&
    process.env.DB01_REMOTE_TEST_DATABASE_CONFIRM !==
      "RESET:" + target.hostname.toLowerCase() + "/" + dbName) {
  throw new Error("Remote last-admin tests require exact disposable DB confirmation");
}
const pool = new Pool({ connectionString: url, max: 6, statement_timeout: 12_000 });

const actor: RequestContext = {
  user: {
    id: SEED_IDS.superAdminUser,
    identityUid: "seed-super-admin",
    platformStatus: "ACTIVE",
    systemRoles: ["SUPER_ADMIN"],
  },
  membership: null,
};

type Member = { userId: string; membershipId: string; identityUid: string };
type Fixture = { organizationId: string; collegeId: string; members: Member[] };

async function withAdmins(count: number, run: (fixture: Fixture) => Promise<void>) {
  const organizationId = randomUUID();
  const collegeId = randomUUID();
  const token = organizationId.replaceAll("-", "");
  const members = Array.from({length:count}, () => ({
    userId: randomUUID(),
    membershipId: randomUUID(),
    identityUid: "last-admin-" + randomUUID(),
  }));
  const fixture: Fixture = { organizationId, collegeId, members };
  try {
    await pool.query(
      "insert into organizations(id,name,status) values($1,$2,'ACTIVE')",
      [organizationId, "Last admin test organization " + token],
    );
    await pool.query(
      "insert into colleges(id,organization_id,name,code,status) values($1,$2,$3,$4,'ACTIVE')",
      [collegeId, organizationId, "Last admin test college " + token, "LAC-" + token],
    );
    for (const member of members) {
      await pool.query(
        "insert into users(id,identity_uid,display_name,platform_status) values($1,$2,$3,'ACTIVE')",
        [member.userId, member.identityUid, "Last admin integration target"],
      );
      await pool.query(
        "insert into college_memberships(id,user_id,college_id,status) values($1,$2,$3,'ACTIVE')",
        [member.membershipId,member.userId,collegeId],
      );
      await pool.query(
        "insert into membership_roles(membership_id,role) values($1,'COLLEGE_ADMIN'),($1,'FACULTY')",
        [member.membershipId],
      );
    }
    await run(fixture);
  } finally {
    const membershipIds=members.map(m=>m.membershipId);
    const userIds=members.map(m=>m.userId);
    await pool.query(
      "delete from activity_events where subject_type='college_membership' and subject_id=any($1::uuid[])",
      [membershipIds],
    );
    await pool.query("delete from activity_events where subject_type='user' and subject_id=any($1::uuid[])", [userIds]);
    await pool.query("delete from identity_device_sessions where user_id=any($1::uuid[])", [userIds]);
    await pool.query("delete from membership_roles where membership_id=any($1::uuid[])", [membershipIds]);
    await pool.query("delete from college_memberships where id=any($1::uuid[])", [membershipIds]);
    await pool.query("delete from users where id=any($1::uuid[])", [userIds]);
    await pool.query("delete from colleges where id=$1", [collegeId]);
    await pool.query("delete from organizations where id=$1", [organizationId]);
  }
}

function mutation(f:Fixture, m: Member): MembershipMutationContext {
  const now=new Date();
  return {
    context: actor,
    person: {
      organizationId:f.organizationId,
      user:{id:m.userId,identityUid:m.identityUid,phoneE164:null,email:null,displayName:"Last admin integration target"},
      membership:{
        id:m.membershipId,collegeId:f.collegeId,status:"ACTIVE",
        suspendedAt:null,suspensionReason:null,createdAt:now,updatedAt:now,
        roles:["COLLEGE_ADMIN","FACULTY"],
      },
    },
  };
}

async function liveAdmins(collegeId:string) {
  const result=await pool.query<{id:string}>([
    "select cm.id from college_memberships cm",
    "join membership_roles mr on mr.membership_id=cm.id and mr.role='COLLEGE_ADMIN'",
    "join users u on u.id=cm.user_id and u.platform_status='ACTIVE'",
    "where cm.college_id=$1 and cm.status='ACTIVE' order by cm.id",
  ].join(" "),[collegeId]);
  return result.rows.map(row=>row.id);
}

afterAll(async()=>{await pool.end();await closeDatabaseConnection();});

describe("#81 last active College Admin guard",()=>{
  it("rejects removing, suspending, or ending a sole admin and leaves their roles and status unchanged",async()=>{
    await withAdmins(1,async f=>{
      const m=f.members[0]!;
      await expect(drizzlePeopleRepository.removeMembershipRole(
        m.membershipId,"COLLEGE_ADMIN",mutation(f,m),
      )).rejects.toMatchObject({code:"LAST_COLLEGE_ADMIN"});
      await expect(drizzlePeopleRepository.transitionMembershipLifecycle(
        m.membershipId,{action:"SUSPEND",reason:"Security roster coverage"},mutation(f,m),
      )).rejects.toMatchObject({code:"LAST_COLLEGE_ADMIN"});
      await expect(drizzlePeopleRepository.transitionMembershipLifecycle(
        m.membershipId,{action:"END"},mutation(f,m),
      )).rejects.toMatchObject({code:"LAST_COLLEGE_ADMIN"});
      expect(await liveAdmins(f.collegeId)).toEqual([m.membershipId]);
      const status=await pool.query<{status:string}>(
        "select status from college_memberships where id=$1",[m.membershipId]);
      expect(status.rows[0]?.status).toBe("ACTIVE");
      const audit=await pool.query(
        "select id from activity_events where subject_type='college_membership' and subject_id=$1",
        [m.membershipId]);
      expect(audit.rows).toHaveLength(0);
    });
  });

  it("does not block cleanup of an administrator who was already disabled outside the membership writer",async()=>{
    await withAdmins(1,async f=>{
      const m=f.members[0]!;
      await pool.query("update users set platform_status='DISABLED' where id=$1",[m.userId]);
      const remaining=await drizzlePeopleRepository.removeMembershipRole(
        m.membershipId,"COLLEGE_ADMIN",mutation(f,m));
      expect(remaining).toEqual(["FACULTY"]);
      expect(await liveAdmins(f.collegeId)).toEqual([]);
    });
  });

  it("allows an authorized admin role removal only when an independent active replacement remains",async()=>{
    await withAdmins(2,async f=>{
      const [a,b]=f.members as [Member,Member];
      expect(await drizzlePeopleRepository.removeMembershipRole(
        a.membershipId,"COLLEGE_ADMIN",mutation(f,a),
      )).toEqual(["FACULTY"]);
      expect(await liveAdmins(f.collegeId)).toEqual([b.membershipId]);
      await expect(drizzlePeopleRepository.removeMembershipRole(
        b.membershipId,"COLLEGE_ADMIN",mutation(f,b),
      )).rejects.toMatchObject({code:"LAST_COLLEGE_ADMIN"});
      expect(await liveAdmins(f.collegeId)).toEqual([b.membershipId]);
    });
  });

  it("does not count a disabled or suspended replacement as active coverage",async()=>{
    await withAdmins(2,async f=>{
      const [a,b]=f.members as [Member,Member];
      await pool.query("update users set platform_status='DISABLED' where id=$1",[b.userId]);
      await expect(drizzlePeopleRepository.removeMembershipRole(
        a.membershipId,"COLLEGE_ADMIN",mutation(f,a),
      )).rejects.toMatchObject({code:"LAST_COLLEGE_ADMIN"});
      await pool.query("update users set platform_status='ACTIVE' where id=$1",[b.userId]);
      await pool.query(
        "update college_memberships set status='SUSPENDED',suspended_at=now(),suspension_reason='test' where id=$1",
        [b.membershipId],
      );
      await expect(drizzlePeopleRepository.transitionMembershipLifecycle(
        a.membershipId,{action:"END"},mutation(f,a),
      )).rejects.toMatchObject({code:"LAST_COLLEGE_ADMIN"});
      expect(await liveAdmins(f.collegeId)).toEqual([a.membershipId]);
    });
  });

  it("allows suspension with another active admin, then denies ending the final active admin",async()=>{
    await withAdmins(2,async f=>{
      const [a,b]=f.members as [Member,Member];
      const changed=await drizzlePeopleRepository.transitionMembershipLifecycle(
        a.membershipId,{action:"SUSPEND",reason:"Admin rotation"},mutation(f,a));
      expect(changed.membership.status).toBe("SUSPENDED");
      expect(await liveAdmins(f.collegeId)).toEqual([b.membershipId]);
      await expect(drizzlePeopleRepository.transitionMembershipLifecycle(
        b.membershipId,{action:"END"},mutation(f,b),
      )).rejects.toMatchObject({code:"LAST_COLLEGE_ADMIN"});
      expect(await liveAdmins(f.collegeId)).toEqual([b.membershipId]);
      const restored=await drizzlePeopleRepository.transitionMembershipLifecycle(
        a.membershipId,{action:"REACTIVATE"},mutation(f,a));
      expect(restored.membership.status).toBe("ACTIVE");
      expect((await liveAdmins(f.collegeId))).toHaveLength(2);
    });
  });

  it("serializes two concurrent role removals so precisely one admin remains",async()=>{
    await withAdmins(2,async f=>{
      const [a,b]=f.members as [Member,Member];
      const outcomes=await Promise.allSettled([
        drizzlePeopleRepository.removeMembershipRole(
          a.membershipId,"COLLEGE_ADMIN",mutation(f,a)),
        drizzlePeopleRepository.removeMembershipRole(
          b.membershipId,"COLLEGE_ADMIN",mutation(f,b)),
      ]);
      expect(outcomes.filter(o=>o.status==="fulfilled")).toHaveLength(1);
      expect(outcomes.filter(o=>o.status==="rejected")).toEqual([
        expect.objectContaining({status:"rejected",reason:expect.objectContaining({code:"LAST_COLLEGE_ADMIN"})}),
      ]);
      expect(await liveAdmins(f.collegeId)).toHaveLength(1);
    });
  },20_000);

  it("serializes role removal against a simultaneous suspension",async()=>{
    await withAdmins(2,async f=>{
      const [a,b]=f.members as [Member,Member];
      const outcomes=await Promise.allSettled([
        drizzlePeopleRepository.removeMembershipRole(
          a.membershipId,"COLLEGE_ADMIN",mutation(f,a)),
        drizzlePeopleRepository.transitionMembershipLifecycle(
          b.membershipId,{action:"SUSPEND",reason:"Parallel admin transition"},mutation(f,b)),
      ]);
      expect(outcomes.filter(o=>o.status==="fulfilled")).toHaveLength(1);
      expect(outcomes.filter(o=>o.status==="rejected")).toEqual([
        expect.objectContaining({status:"rejected",reason:expect.objectContaining({code:"LAST_COLLEGE_ADMIN"})}),
      ]);
      expect(await liveAdmins(f.collegeId)).toHaveLength(1);
    });
  },20_000);

  it("denies platform-wide disabling of the sole administrator and keeps their user active",async()=>{
    await withAdmins(1,async f=>{
      const m=f.members[0]!;
      await expect(changePlatformAccountStatus(actor,m.userId,{
        status:"DISABLED",reason:"Check administrator coverage",confirmed:true,
      })).rejects.toMatchObject({code:"LAST_COLLEGE_ADMIN"});
      const user=await pool.query<{platform_status:string}>(
        "select platform_status from users where id=$1",[m.userId]);
      expect(user.rows[0]?.platform_status).toBe("ACTIVE");
      expect(await liveAdmins(f.collegeId)).toEqual([m.membershipId]);
    });
  });

  it("allows disabling one administrator, but not the remaining administrator",async()=>{
    await withAdmins(2,async f=>{
      const [a,b]=f.members as [Member,Member];
      const allowed=await changePlatformAccountStatus(actor,a.userId,{
        status:"DISABLED",reason:"Change account access during rotation",confirmed:true,
      });
      expect(allowed).toMatchObject({userId:a.userId,status:"DISABLED",changed:true});
      expect(await liveAdmins(f.collegeId)).toEqual([b.membershipId]);
      await expect(changePlatformAccountStatus(actor,b.userId,{
        status:"DISABLED",reason:"Would leave college without an administrator",confirmed:true,
      })).rejects.toMatchObject({code:"LAST_COLLEGE_ADMIN"});
      expect(await liveAdmins(f.collegeId)).toEqual([b.membershipId]);
    });
  });

  it("serializes a global account disable against another administrator's membership suspension",async()=>{
    await withAdmins(2,async f=>{
      const [a,b]=f.members as [Member,Member];
      const outcomes=await Promise.allSettled([
        changePlatformAccountStatus(actor,a.userId,{
          status:"DISABLED",reason:"Concurrent account block test",confirmed:true,
        }),
        drizzlePeopleRepository.transitionMembershipLifecycle(
          b.membershipId,{action:"SUSPEND",reason:"Concurrent membership suspension"},mutation(f,b)),
      ]);
      expect(outcomes.filter(o=>o.status==="fulfilled")).toHaveLength(1);
      expect(outcomes.filter(o=>o.status==="rejected")).toEqual([
        expect.objectContaining({status:"rejected",reason:expect.objectContaining({code:"LAST_COLLEGE_ADMIN"})}),
      ]);
      expect(await liveAdmins(f.collegeId)).toHaveLength(1);
    });
  },20_000);

});
