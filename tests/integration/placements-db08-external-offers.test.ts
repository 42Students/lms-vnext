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
 * SOURCE-AUTHORED SPECIFICATIONS, NOT A SUCCESSFUL PG RUN.
 * W01 must first register the DB08-C schema + tenant/history triggers.
 * This suite deliberately refuses any unconfirmed or shared test database.
 */
const url = process.env.TEST_DATABASE_URL;
if (!url || url !== process.env.DATABASE_URL ||
    process.env.DB08_ISOLATED_TEST_DATABASE !== "1" ||
    process.env.DB08_C_MIGRATION_APPLIED !== "1") {
  throw new Error(
    "DB08-C requires the identical disposable TEST_DATABASE_URL/DATABASE_URL, " +
    "DB08_ISOLATED_TEST_DATABASE=1 and DB08_C_MIGRATION_APPLIED=1",
  );
}
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
    roles: ["FACULTY", "TPO"],
  },
};
const forgedUser: RequestContext = {
  ...learner,
  user: { ...learner.user, id: SEED_IDS.facultyUser },
};

beforeEach(async () => {
  created.length = 0;
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
