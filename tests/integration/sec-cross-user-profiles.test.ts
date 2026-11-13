import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { getLearnerProfileWithRuntime, upsertLearnerProfileWithRuntime } from "@/modules/people/runtime";
import {
  deactivateLearnerGalleryImage,
  LearnerGalleryError,
  listLearnerGallery,
  openLearnerGalleryImage,
} from "@/modules/profile-verification/learner-image-gallery-service";
import { VerificationStateError } from "@/modules/profile-verification/domain";
import { openCollegeVerificationDocument } from "@/modules/verification/staff-private-document-service";
import { SEED_IDS } from "../../scripts/db-seed-data";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";
import { contextFor, insertPerson as insertActor, person, type Person, type TestRole } from "../support/actors";

// The storage layer is a spy: this file proves WHO is allowed to ask for a signed link, and that nobody else ever does.
const grants = vi.hoisted(() => ({ calls: [] as Array<{ objectKey: string; ownerMembershipId: string }> }));
vi.mock("@/modules/storage/private-object-storage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/modules/storage/private-object-storage")>()),
  createPrivateReadGrant: vi.fn(async (input: { objectKey: string; ownerMembershipId: string }) => {
    grants.calls.push(input);
    return { readUrl: "https://files.example.test/signed", expiresAt: new Date(Date.now() + 60_000) } as never;
  }),
}));

/**
 * Learner profile data between people of the SAME college: the admin-managed profile, the profile image gallery and the
 * staff-only verification documents (certificates, identity). Learner A owns the data. Learner B is a classmate, a faculty
 * member and a TPO are staff of other kinds, and a College Admin of another college is a stranger. Only the right people
 * may read or change it, every refusal must be an access error rather than a crash or a validation message, and a refused
 * write must leave the data exactly as it was.
 */
if (!process.env.TEST_DATABASE_URL || process.env.DB03_ISOLATED_TEST_DATABASE !== "1") {
  throw new Error("sec-cross-user-profiles needs TEST_DATABASE_URL and DB03_ISOLATED_TEST_DATABASE=1 (disposable database)");
}
assertDb018DisposableTarget(process.env, { serviceBound: true });
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 2 });

const learnerAp = person();
const learnerBp = person();
const facultyP = person();
const tpoP = person();
const adminBp = person(); // a College Admin of college B
const collegeA = SEED_IDS.collegeA;
const collegeB = SEED_IDS.collegeB;
const ROLL = "SEC-ROLL-" + learnerAp.user.slice(0, 8);
const receiptA = randomUUID(); // A's marksheet (clean, private)
const receiptB = randomUUID(); // B's own marksheet
const verificationA = randomUUID();
const objectKeyA = "private/sec-prof/" + receiptA;

const as = (p: Person, role: TestRole, collegeId: string = collegeA): RequestContext => contextFor(p, role, collegeId, "sec-prof");
const learnerA = as(learnerAp, "LEARNER");
const learnerB = as(learnerBp, "LEARNER");
const faculty = as(facultyP, "FACULTY");
const tpo = as(tpoP, "TPO");
const adminA: RequestContext = {
  user: { id: SEED_IDS.collegeAdminUser, identityUid: "sec-prof-admin", platformStatus: "ACTIVE", systemRoles: [] },
  membership: { id: SEED_IDS.collegeAdminMembership, collegeId: collegeA, organizationId: SEED_IDS.organization, status: "ACTIVE", roles: ["COLLEGE_ADMIN"] },
};
const adminB = as(adminBp, "COLLEGE_ADMIN", collegeB);

const insertPerson = (p: Person, role: string, name: string, collegeId: string) => insertActor(pool, p, role, name, collegeId, "sec-prof");

/** The call must be refused by an access rule, never by bad input or a crash. */
async function refusedWith(call: Promise<unknown>, who: string, kind: "authorization" | "gallery" | "verification") {
  let error: unknown = null;
  try {
    await call;
  } catch (caught) {
    error = caught;
  }
  expect(error, who + " must be refused").not.toBeNull();
  if (kind === "authorization") expect(error, who).toBeInstanceOf(AuthorizationError);
  if (kind === "gallery") {
    expect(error, who).toBeInstanceOf(LearnerGalleryError);
    expect((error as LearnerGalleryError).code, who).toBe("GALLERY_FORBIDDEN");
  }
  if (kind === "verification") expect(error instanceof AuthorizationError || error instanceof VerificationStateError, who + ": " + String(error)).toBe(true);
}

const rollOf = async (membership: string) =>
  (await pool.query("SELECT roll_number FROM learner_profiles WHERE membership_id=$1", [membership])).rows[0]?.roll_number ?? null;

describe("learner profile data: nobody can reach another person's profile", () => {
  beforeAll(async () => {
    process.env["DB04_PROFILE_GALLERY_READY"] = "DB04_VERIFIED";
    await insertPerson(learnerAp, "LEARNER", "SEC-PROF Learner A", collegeA);
    await insertPerson(learnerBp, "LEARNER", "SEC-PROF Learner B", collegeA);
    await insertPerson(facultyP, "FACULTY", "SEC-PROF Faculty", collegeA);
    await insertPerson(tpoP, "TPO", "SEC-PROF TPO", collegeA);
    await insertPerson(adminBp, "COLLEGE_ADMIN", "SEC-PROF Admin of B", collegeB);
    await pool.query("INSERT INTO learner_profiles(membership_id,roll_number) VALUES($1,$2)", [learnerAp.membership, ROLL]);
    // A real verification case for learner A with one clean document, and a separate document owned by learner B.
    for (const [id, owner, user, key] of [
      [receiptA, learnerAp.membership, learnerAp.user, objectKeyA],
      [receiptB, learnerBp.membership, learnerBp.user, "private/sec-prof/" + receiptB],
    ] as const) {
      await pool.query(
        "INSERT INTO profile_private_document_receipts(id,owning_membership_id,purpose,private_object_key,object_generation,sha256_hex,mime_type,size_bytes,scan_status,uploaded_by_user_id) VALUES($1,$2,'MARKSHEET',$3,'1',$4,'application/pdf',100,'CLEAN',$5)",
        [id, owner, key, "a".repeat(64), user],
      );
    }
    await pool.query(
      "INSERT INTO profile_verifications(id,learner_membership_id,section,status,submitted_snapshot,submitted_at) VALUES($1,$2,'EDUCATION','SUBMITTED',$3::jsonb,now())",
      [verificationA, learnerAp.membership, JSON.stringify({ education: [{ marksheetDocumentId: receiptA }] })],
    );
  }, 60_000);

  beforeEach(() => {
    grants.calls.length = 0;
  });

  afterAll(async () => {
    try {
      const q = (sql: string, args: unknown[]) => pool.query(sql, args).catch(() => undefined);
      await q("DELETE FROM profile_verification_events WHERE verification_id=$1", [verificationA]);
      await q("DELETE FROM profile_verifications WHERE id=$1", [verificationA]);
      await q("DELETE FROM profile_private_document_receipts WHERE id=ANY($1::uuid[])", [[receiptA, receiptB]]);
      await q("DELETE FROM learner_profiles WHERE membership_id=ANY($1::uuid[])", [[learnerAp.membership, learnerBp.membership]]);
      for (const p of [learnerAp, learnerBp, facultyP, tpoP, adminBp]) {
        await q("DELETE FROM membership_roles WHERE id=$1", [p.role]);
        await q("DELETE FROM college_memberships WHERE id=$1", [p.membership]);
        await q("DELETE FROM users WHERE id=$1", [p.user]);
      }
    } finally {
      delete process.env["DB04_PROFILE_GALLERY_READY"];
      await pool.end();
      await closeDatabaseConnection();
    }
  }, 60_000);

  describe("the managed learner profile", () => {
    it("the college's administrator can read it", async () => {
      const profile = await getLearnerProfileWithRuntime(adminA, learnerAp.membership);
      expect(JSON.stringify(profile)).toContain(ROLL);
    });

    it("another learner, the learner themself on this admin path, faculty, a TPO and another college's administrator cannot", async () => {
      for (const [who, actor] of [
        ["classmate B", learnerB], ["learner A on the admin path", learnerA], ["faculty", faculty], ["TPO", tpo], ["admin of another college", adminB],
      ] as const) {
        await refusedWith(getLearnerProfileWithRuntime(actor, learnerAp.membership), who, "authorization");
      }
    });

    it("none of them can change it, and the stored value is untouched", async () => {
      for (const [who, actor] of [
        ["classmate B", learnerB], ["faculty", faculty], ["TPO", tpo], ["admin of another college", adminB],
      ] as const) {
        await refusedWith(
          upsertLearnerProfileWithRuntime(actor, learnerAp.membership, { rollNumber: "HIJACKED", registrationNumber: "HIJACKED" }),
          who, "authorization",
        );
      }
      expect(await rollOf(learnerAp.membership)).toBe(ROLL);
      expect(await rollOf(learnerBp.membership)).toBeNull();
    });
  });

  describe("the profile image gallery", () => {
    it("the owner can list their own, and the college's administrator can list it too", async () => {
      expect((await listLearnerGallery(learnerA)).canUpload).toBe(true);
      const forStaff = await listLearnerGallery(adminA, learnerAp.membership);
      expect(forStaff.canUpload).toBe(false); // staff may remove an unsafe picture, never publish one
    });

    it("a classmate, faculty, a TPO and another college's administrator cannot list it", async () => {
      for (const [who, actor] of [["classmate B", learnerB], ["faculty", faculty], ["TPO", tpo], ["admin of another college", adminB]] as const) {
        await refusedWith(listLearnerGallery(actor, learnerAp.membership), who, "gallery");
      }
    });

    it("nobody else can open or remove one of A's images, even by its exact id", async () => {
      const imageId = randomUUID();
      for (const [who, actor] of [["classmate B", learnerB], ["faculty", faculty], ["TPO", tpo], ["admin of another college", adminB]] as const) {
        await refusedWith(openLearnerGalleryImage(actor, imageId, learnerAp.membership), who + " open", "gallery");
        await refusedWith(deactivateLearnerGalleryImage(actor, imageId, learnerAp.membership), who + " remove", "gallery");
      }
    });

    it("the refusal is about access: the owner asking for a missing image gets 'not found', not 'forbidden'", async () => {
      await expect(openLearnerGalleryImage(learnerA, randomUUID())).rejects.toMatchObject({ code: "GALLERY_NOT_FOUND" });
    });

    it("a learner's gallery reads are always their own unless staff", async () => {
      // B asking with no target lists B's own, never A's.
      const own = await listLearnerGallery(learnerB);
      expect(own.canUpload).toBe(true);
      await refusedWith(listLearnerGallery(learnerB, learnerAp.membership), "B naming A", "gallery");
    });
  });

  describe("staff-only verification documents (certificates, identity)", () => {
    it("this college's administrator can open a document that is really in the learner's submission", async () => {
      const grant = await openCollegeVerificationDocument(adminA, learnerAp.membership, "EDUCATION", receiptA);
      expect(grant.readUrl).toBe("https://files.example.test/signed");
      expect(grants.calls).toEqual([expect.objectContaining({ objectKey: objectKeyA, ownerMembershipId: learnerAp.membership })]);
    });

    it("a classmate, the learner on the staff path, faculty and a TPO are refused as not staff", async () => {
      for (const [who, actor] of [
        ["classmate B", learnerB], ["learner A on the staff path", learnerA], ["faculty", faculty], ["TPO", tpo],
      ] as const) {
        await refusedWith(openCollegeVerificationDocument(actor, learnerAp.membership, "EDUCATION", receiptA), who, "authorization");
      }
      expect(grants.calls, "no signed link may be requested for a refused caller").toEqual([]);
    });

    it("another college's administrator is a real staff member, yet cannot reach this college's learner", async () => {
      let error: unknown = null;
      try {
        await openCollegeVerificationDocument(adminB, learnerAp.membership, "EDUCATION", receiptA);
      } catch (caught) {
        error = caught;
      }
      // Their college has no such case: the lookup is scoped by the caller's own college, so it is "not allowed", not "forbidden".
      expect(error).toBeInstanceOf(VerificationStateError);
      expect(grants.calls).toEqual([]);
    });

    it("this college's administrator cannot open another learner's receipt through this learner's case", async () => {
      for (const receipt of [receiptB, randomUUID()]) {
        await expect(openCollegeVerificationDocument(adminA, learnerAp.membership, "EDUCATION", receipt)).rejects.toBeInstanceOf(VerificationStateError);
      }
      expect(grants.calls).toEqual([]);
    });

    it("the other section of the same learner has no case, so nothing opens there either", async () => {
      await expect(openCollegeVerificationDocument(adminA, learnerAp.membership, "IDENTITY", receiptA)).rejects.toBeInstanceOf(VerificationStateError);
      expect(grants.calls).toEqual([]);
    });
  });
});
