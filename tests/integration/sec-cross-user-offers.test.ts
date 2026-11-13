import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { ZodError } from "zod";
import { randomUUID } from "node:crypto";
import { closeDatabaseConnection } from "@/db/client";
import { AuthorizationError } from "@/modules/permissions/policy";
import { PlacementsServiceError } from "@/modules/placements/errors";
import {
  actOnPlacementOffer,
  getLatestPlacementOfferForApplication,
  listOwnPlacementOffers,
  listPlacementJobOffers,
  listPlacementOfferHistoryForApplication,
  previewOwnOfferAcceptanceImpact,
} from "@/modules/placements/offer-service";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { seedPlacementCollege, type PlacementCollege } from "../support/placement-college";

/**
 * Placement offers: object-level access between people of the SAME college.
 *
 * Learner A holds an issued offer on their application, learner B holds a different one. Both are eligible, so every refusal is
 * about ownership or role. A learner sees and answers only their own offer (and a foreign offer must look exactly like a missing
 * one); the college's placement staff manage offers; faculty and another college's staff have no access. A refused answer must
 * leave the offer untouched.
 */
if (!process.env.TEST_DATABASE_URL || process.env.DB03_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("sec-cross-user-offers needs TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1 (disposable database)");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });

let c: PlacementCollege;
let offerA = "";
let offerB = "";

async function issue(applicationId: string, issuer: string): Promise<string> {
  const row = await pool.query(
    "INSERT INTO placement_offers(application_id,version,status,role_title,issued_by_user_id,issued_at,expires_at) VALUES($1,1,'ISSUED','SEC offer',$2,now()-interval '1 day',now()+interval '3 days') RETURNING id",
    [applicationId, issuer],
  );
  return row.rows[0].id as string;
}
const offerStatus = async (id: string) =>
  (await pool.query("SELECT status FROM placement_offers WHERE id=$1", [id])).rows[0]?.status as string | undefined;

/** Refused by an access rule or the non-leaking not-found: never a validation error or a crash. */
async function refused(call: Promise<unknown>, who: string) {
  let error: unknown = null;
  try {
    await call;
  } catch (caught) {
    error = caught;
  }
  expect(error, who + " must be refused").not.toBeNull();
  expect(error instanceof ZodError, who + " was refused for invalid input, not for access").toBe(false);
  expect(error instanceof AuthorizationError || error instanceof PlacementsServiceError, who + ": " + String(error)).toBe(true);
  return error;
}

describe("placement offers: nobody can reach another person's offer", () => {
  beforeAll(async () => {
    c = await seedPlacementCollege(pool, "sec-off");
    const admin = (await pool.query("SELECT id FROM users LIMIT 1")).rows[0].id as string;
    offerA = await issue(c.applicationA, admin);
    offerB = await issue(c.applicationB, admin);
  }, 90_000);

  afterAll(async () => {
    try {
      await pool.query("DELETE FROM placement_offers WHERE id=ANY($1::uuid[])", [[offerA, offerB]]).catch(() => undefined);
      await c?.cleanup();
    } finally {
      await pool.end();
      await closeDatabaseConnection();
    }
  }, 90_000);

  describe("reading", () => {
    it("each learner sees their own offer and never a classmate's", async () => {
      const a = (await listOwnPlacementOffers(c.learnerA)).map((row: { offer: { id: string } }) => row.offer.id);
      const b = (await listOwnPlacementOffers(c.learnerB)).map((row: { offer: { id: string } }) => row.offer.id);
      expect(a).toContain(offerA);
      expect(a).not.toContain(offerB);
      expect(b).toContain(offerB);
      expect(b).not.toContain(offerA);
    });

    it("the owner and the college's placement staff can read the offer and its history", async () => {
      for (const [who, actor] of [["learner A", c.learnerA], ["tpo", c.tpo], ["admin", c.admin]] as const) {
        expect((await getLatestPlacementOfferForApplication(actor, c.applicationA))?.id, who).toBe(offerA);
        expect((await listPlacementOfferHistoryForApplication(actor, c.applicationA)).length, who).toBeGreaterThan(0);
      }
    });

    it("a classmate, faculty and another college's TPO cannot read someone else's offer or its history", async () => {
      for (const [who, actor] of [["classmate B", c.learnerB], ["faculty", c.faculty], ["other college TPO", c.otherCollegeTpo]] as const) {
        await refused(getLatestPlacementOfferForApplication(actor, c.applicationA), who + " latest");
        await refused(listPlacementOfferHistoryForApplication(actor, c.applicationA), who + " history");
      }
    });

    it("the drive's offer list is for staff of that college only", async () => {
      expect((await listPlacementJobOffers(c.tpo, c.jobA)).length).toBeGreaterThan(0);
      for (const [who, actor] of [["learner A", c.learnerA], ["learner B", c.learnerB], ["faculty", c.faculty], ["other college TPO", c.otherCollegeTpo]] as const) {
        await refused(listPlacementJobOffers(actor, c.jobA), who);
      }
    });
  });

  describe("answering", () => {
    it("a classmate cannot see the effect of accepting, nor accept or decline, and a foreign offer looks exactly like a missing one", async () => {
      const missing = await refused(previewOwnOfferAcceptanceImpact(c.learnerB, randomUUID()), "B on a missing offer");
      const foreign = await refused(previewOwnOfferAcceptanceImpact(c.learnerB, offerA), "B previewing A's offer");
      expect((foreign as PlacementsServiceError).code).toBe((missing as PlacementsServiceError).code);
      await refused(actOnPlacementOffer(c.learnerB, offerA, { action: "ACCEPT" }), "B accepting A's offer");
      await refused(actOnPlacementOffer(c.learnerB, offerA, { action: "DECLINE", reason: "Not mine to decline" }), "B declining A's offer");
      expect(await offerStatus(offerA)).toBe("ISSUED");
    });

    it("staff, faculty and another college's TPO cannot answer on a learner's behalf", async () => {
      for (const [who, actor] of [["tpo", c.tpo], ["admin", c.admin], ["faculty", c.faculty], ["other college TPO", c.otherCollegeTpo]] as const) {
        await refused(actOnPlacementOffer(actor, offerA, { action: "ACCEPT" }), who + " accepting for the learner");
        await refused(actOnPlacementOffer(actor, offerA, { action: "DECLINE", reason: "Declined for them" }), who + " declining for the learner");
      }
      expect(await offerStatus(offerA)).toBe("ISSUED");
      expect(await offerStatus(offerB)).toBe("ISSUED");
    });
  });
});
