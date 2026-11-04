import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import {
  listManagedExternalOffers,
  listOwnExternalOffers,
  reviewExternalOffer,
  submitOwnExternalOffer,
} from "@/modules/placements/external-offer-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { enableSeedLearnerPlacementAccess } from "../support/w04-placement-access-fixture";

/**
 * Integration suite for registered migration 0094 (DB08-C external offers,
 * saved jobs, tenant/history triggers). Refuses any unconfirmed or shared
 * test database; run against a disposable Postgres with all migrations applied.
 */
if (!process.env.TEST_DATABASE_URL ||
    process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL ||
    process.env.DB08_ISOLATED_TEST_DATABASE !== "1" ||
    process.env.DB08_C_MIGRATION_APPLIED !== "1") {
  throw new Error(
    "DB08-C requires the identical disposable TEST_DATABASE_URL/DATABASE_URL, " +
    "DB08_ISOLATED_TEST_DATABASE=1 and DB08_C_MIGRATION_APPLIED=1",
  );
}
const url = process.env.TEST_DATABASE_URL;
const pool = new Pool({ connectionString: url, max: 2 });
const created: string[] = [];
const learner: RequestContext = {
  user: {
    id: SEED_IDS.learnerUser, identityUid: "seed-learner",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.learnerCollegeAMembership,
    organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeA, status: "ACTIVE", roles: ["LEARNER"],
  },
};
const tpo: RequestContext = {
  user: {
    id: SEED_IDS.facultyUser, identityUid: "seed-faculty",
    platformStatus: "ACTIVE", systemRoles: [],
  },
  membership: {
    id: SEED_IDS.facultyCollegeAMembership,
    organizationId: SEED_IDS.organization,
    collegeId: SEED_IDS.collegeA, status: "ACTIVE",
    roles: ["TPO"],
  },
};
const forgedUser: RequestContext = {
  ...learner,
  user: { ...learner.user, id: SEED_IDS.facultyUser },
};

beforeEach(async () => {
  created.length = 0;
  // The selected workspace carries exactly one role. The authorization layer
  // additionally checks this TPO grant against persisted membership_roles.
  // A separate negative test removes it to prove revocation is effective.
  await pool.query(
    "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT (membership_id,role) DO NOTHING",
    [SEED_IDS.facultyCollegeAMembership],
  );
  await enableSeedLearnerPlacementAccess(pool);
});
afterEach(async () => {
  // Permitted only because the suite is isolated + env guarded.
  await pool.query("TRUNCATE TABLE placement_external_offer_events");
  await pool.query("DELETE FROM placement_external_offers WHERE id=ANY($1::uuid[])", [created]);
});
afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
});

describe("W04 external placement submission and review", () => {
  it("submits one off-campus offer idempotently without an invented job/application", async () => {
    const first = await submitOwnExternalOffer(learner, {
      companyName: "External Systems", ctcLpa: "12.50",
    });
    created.push(first.id);
    expect(first.status).toBe("SUBMITTED");
    expect(first.ctcLpa).toBe("12.50");
    expect("privateLetterObjectPath" in first).toBe(false);
    const duplicate = await submitOwnExternalOffer(learner, {
      companyName: "  external systems  ", ctcLpa: "12.50",
    });
    expect(duplicate.id).toBe(first.id);
    const events = await pool.query(
      "SELECT next_status FROM placement_external_offer_events WHERE offer_id=$1",
      [first.id],
    );
    expect(events.rows.map(x => x.next_status)).toEqual(["SUBMITTED"]);
  });

  it("moves SUBMITTED → VERIFIED → REVOKED with reviewer identity and append-only audit", async () => {
    const pending = await submitOwnExternalOffer(learner, {
      companyName: "Outside Company", ctcLpa: "8.25",
    });
    created.push(pending.id);
    const verified = await reviewExternalOffer(tpo, {
      offerId: pending.id, action: "VERIFY",
    });
    expect(verified?.status).toBe("VERIFIED");
    expect(verified?.reviewedAt).toBeTruthy();
    const repeat = await reviewExternalOffer(tpo, {
      offerId: pending.id, action: "VERIFY",
    });
    expect(repeat?.status).toBe("VERIFIED");
    const revoked = await reviewExternalOffer(tpo, {
      offerId: pending.id, action: "REVOKE",
      reason: "Offer rescinded",
    });
    expect(revoked?.status).toBe("REVOKED");
    await expect(reviewExternalOffer(tpo, {
      offerId: pending.id, action: "VERIFY",
    })).rejects.toMatchObject({ code: "DB08_EXTERNAL_OFFER_INVALID_TRANSITION" });
    const history = await pool.query(
      "SELECT next_status FROM placement_external_offer_events WHERE offer_id=$1 ORDER BY occurred_at, id",
      [pending.id],
    );
    expect(history.rows.map(x => x.next_status).sort()).toEqual(
      ["SUBMITTED", "VERIFIED", "REVOKED"].sort(),
    );
    await expect(pool.query(
      "DELETE FROM placement_external_offer_events WHERE offer_id=$1", [pending.id],
    )).rejects.toMatchObject({ code: "23514" });
  });

  it("keeps unverified evidence uncounted and restricts review to a manager", async () => {
    const pending = await submitOwnExternalOffer(learner, {
      companyName: "Outside Pending", ctcLpa: null,
    });
    created.push(pending.id);
    await expect(reviewExternalOffer(learner, {
      offerId: pending.id, action: "VERIFY",
    })).rejects.toThrow();
    const own = await listOwnExternalOffers(learner);
    expect(own.find(x => x.id === pending.id)?.status).toBe("SUBMITTED");
    const manager = await listManagedExternalOffers(tpo, SEED_IDS.collegeA);
    expect(manager.some(x => x.id === pending.id)).toBe(true);
    const declined = await reviewExternalOffer(tpo, {
      offerId: pending.id, action: "REJECT", reason: "Letter not verified",
    });
    expect(declined?.status).toBe("REJECTED");
    await expect(reviewExternalOffer(tpo, {
      offerId: pending.id, action: "VERIFY",
    })).rejects.toMatchObject({ code: "DB08_EXTERNAL_OFFER_INVALID_TRANSITION" });
  });

  it("denies private manager list and review after persisted TPO revocation", async () => {
    const pending = await submitOwnExternalOffer(learner, {
      companyName: "Revoked manager must not verify", ctcLpa: "7.25",
    });
    created.push(pending.id);
    await pool.query(
      "DELETE FROM membership_roles WHERE membership_id=$1 AND role='TPO'",
      [SEED_IDS.facultyCollegeAMembership],
    );
    try {
      await expect(listManagedExternalOffers(tpo, SEED_IDS.collegeA))
        .rejects.toThrow("Missing permission: placements.manage");
      await expect(reviewExternalOffer(tpo, {offerId:pending.id,action:"VERIFY"}))
        .rejects.toThrow("Missing permission: placements.manage");
      const status = await pool.query(
        "SELECT status,reviewed_by_user_id FROM placement_external_offers WHERE id=$1",
        [pending.id],
      );
      expect(status.rows[0]).toMatchObject({
        status:"SUBMITTED", reviewed_by_user_id:null,
      });
      const history = await pool.query(
        "SELECT next_status FROM placement_external_offer_events WHERE offer_id=$1",
        [pending.id],
      );
      expect(history.rows.map(row=>row.next_status)).toEqual(["SUBMITTED"]);
    } finally {
      await pool.query(
        "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING",
        [SEED_IDS.facultyCollegeAMembership],
      );
    }
  });

  it("denies staff private offer reads and review after manager account disablement", async () => {
    const pending = await submitOwnExternalOffer(learner,{
      companyName:"Disabled manager should not review",ctcLpa:"9.00",
    });
    created.push(pending.id);
    await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",
      [SEED_IDS.facultyUser]);
    try {
      await expect(listManagedExternalOffers(tpo,SEED_IDS.collegeA))
        .rejects.toThrow("Missing permission: placements.manage");
      await expect(reviewExternalOffer(tpo,{offerId:pending.id,action:"REJECT",reason:"Not approved"}))
        .rejects.toThrow("Missing permission: placements.manage");
      const status=await pool.query(
        "SELECT status FROM placement_external_offers WHERE id=$1",[pending.id],
      );
      expect(status.rows[0]?.status).toBe("SUBMITTED");
    } finally {
      await pool.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1",
        [SEED_IDS.facultyUser]);
    }
  });

  it("serializes outside-offer verification against an in-flight TPO grant revoke", async () => {
    const pending=await submitOwnExternalOffer(learner,{
      companyName:"Race against revoke",ctcLpa:"10.50",
    });
    created.push(pending.id);
    const blockerPool = new Pool({connectionString:url,max:1});
    const holder=await blockerPool.connect();
    let inTransaction=false;
    let operation:Promise<{ok:boolean;error?:unknown}>|null=null;
    try {
      await holder.query("BEGIN");
      inTransaction=true;
      const held=await holder.query(
        "SELECT membership_id FROM membership_roles WHERE membership_id=$1 AND role='TPO' FOR UPDATE",
        [SEED_IDS.facultyCollegeAMembership],
      );
      expect(held.rows).toHaveLength(1);
      operation=reviewExternalOffer(tpo,{offerId:pending.id,action:"VERIFY"})
        .then(()=>({ok:true}),error=>({ok:false,error}));
      let waited=false;
      for(let attempt=0;attempt<160;attempt++){
        const activity=await pool.query<{blocked:string}>(
          "SELECT count(*)::text AS blocked FROM pg_stat_activity " +
          "WHERE datname=current_database() AND pid<>pg_backend_pid() " +
          "AND wait_event_type='Lock' AND query ILIKE '%membership_roles%'",
        );
        if(Number(activity.rows[0]?.blocked??0)>0){waited=true;break;}
        await new Promise(resolve=>setTimeout(resolve,25));
      }
      expect(waited).toBe(true);
      await holder.query(
        "DELETE FROM membership_roles WHERE membership_id=$1 AND role='TPO'",
        [SEED_IDS.facultyCollegeAMembership],
      );
      await holder.query("COMMIT");
      inTransaction=false;
      const outcome=await operation;
      expect(outcome.ok).toBe(false);
      expect(String((outcome.error as Error)?.message??""))
        .toContain("Missing permission: placements.manage");
      const [status,history]=await Promise.all([
        pool.query("SELECT status FROM placement_external_offers WHERE id=$1",[pending.id]),
        pool.query("SELECT next_status FROM placement_external_offer_events WHERE offer_id=$1",[pending.id]),
      ]);
      expect(status.rows[0]?.status).toBe("SUBMITTED");
      expect(history.rows.map(x=>x.next_status)).toEqual(["SUBMITTED"]);
    } finally {
      if(inTransaction)await holder.query("ROLLBACK").catch(()=>undefined);
      holder.release();
      if(operation)await operation;
      await blockerPool.end();
      await pool.query(
        "INSERT INTO membership_roles(membership_id,role) VALUES($1,'TPO') ON CONFLICT DO NOTHING",
        [SEED_IDS.facultyCollegeAMembership],
      );
    }
  },20_000);

  it("denies owner offer submission and private list after persisted account disablement", async () => {
    await pool.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1", [
      SEED_IDS.learnerUser,
    ]);
    try {
      await expect(submitOwnExternalOffer(learner, {
        companyName: "Stale disabled learner", ctcLpa: "10.25",
      })).rejects.toThrow("Missing permission: placements.read");
      await expect(listOwnExternalOffers(learner))
        .rejects.toThrow("Missing permission: placements.read");
      const forbidden = await pool.query(
        "SELECT id FROM placement_external_offers WHERE submitted_by_user_id=$1",
        [SEED_IDS.learnerUser],
      );
      expect(forbidden.rows).toHaveLength(0);
    } finally {
      await pool.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1", [
        SEED_IDS.learnerUser,
      ]);
    }
  });

  it("serializes offer submission against concurrent learner-account disablement", async () => {
    const blockerPool = new Pool({connectionString: url, max: 1});
    const holder = await blockerPool.connect();
    let transactionOpen = false;
    let pending: Promise<{ok:boolean;error?:unknown}> | null = null;
    try {
      await holder.query("BEGIN");
      transactionOpen = true;
      const locked = await holder.query(
        "SELECT id FROM users WHERE id=$1 FOR UPDATE",
        [SEED_IDS.learnerUser],
      );
      expect(locked.rows).toHaveLength(1);
      // The preflight reads ACTIVE without a lock. The transaction's SHARE
      // identity grant must wait for this concurrent account disablement.
      pending = submitOwnExternalOffer(learner, {
        companyName: "Offer blocked by concurrent disable",
        ctcLpa: "7.50",
      }).then(() => ({ok:true}),error => ({ok:false,error}));
      let blocked = false;
      for(let attempt=0;attempt<160;attempt++){
        const activity=await pool.query<{blocked:string}>(
          "SELECT count(*)::text AS blocked FROM pg_stat_activity " +
          "WHERE datname=current_database() AND pid<>pg_backend_pid() " +
          "AND wait_event_type='Lock' AND query ILIKE '%college_memberships%'",
        );
        if(Number(activity.rows[0]?.blocked??0)>0){blocked=true;break;}
        await new Promise(resolve=>setTimeout(resolve,25));
      }
      expect(blocked).toBe(true);
      await holder.query("UPDATE users SET platform_status='DISABLED' WHERE id=$1",[
        SEED_IDS.learnerUser,
      ]);
      await holder.query("COMMIT");
      transactionOpen = false;
      const outcome = await pending;
      expect(outcome.ok).toBe(false);
      expect(String((outcome.error as Error)?.message??""))
        .toContain("Missing permission: placements.read");
      const offers = await pool.query(
        "SELECT id FROM placement_external_offers WHERE submitted_by_user_id=$1",
        [SEED_IDS.learnerUser],
      );
      expect(offers.rows).toHaveLength(0);
    } finally {
      if(transactionOpen) await holder.query("ROLLBACK").catch(()=>undefined);
      holder.release();
      if(pending) await pending;
      await blockerPool.end();
      await pool.query("UPDATE users SET platform_status='ACTIVE' WHERE id=$1",[
        SEED_IDS.learnerUser,
      ]);
    }
  }, 20_000);

  it("rejects a forged learner context and cross-college direct-SQL offer", async () => {
    await expect(submitOwnExternalOffer(forgedUser, {
      companyName: "Forged Offer", ctcLpa: "14.00",
    })).rejects.toThrow("Missing permission: placements.read");
    await expect(pool.query(
      `INSERT INTO placement_external_offers
        (college_id,membership_id,company_name,submitted_by_user_id)
       VALUES($1,$2,'Wrong college',$3)`,
      [SEED_IDS.collegeB, SEED_IDS.learnerCollegeAMembership, SEED_IDS.learnerUser],
    )).rejects.toMatchObject({ code: "23514" });
  });
});
