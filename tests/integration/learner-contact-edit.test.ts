import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { closeDatabaseConnection } from "@/db/client";
import type { RequestContext } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { updateOwnLearnerContacts } from "@/modules/people/learner-contact-service";
import { SEED_IDS } from "../../scripts/db-seed-data";

if (!process.env.TEST_DATABASE_URL) {
  throw new Error("Learner contact tests require a disposable TEST_DATABASE_URL");
}
const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, max: 1 });
let ids: { user: string; membership: string; role: string } | null = null;
let context: RequestContext | null = null;

beforeEach(async () => {
  const next = {
    user: randomUUID(),
    membership: randomUUID(),
    role: randomUUID(),
  };
  ids = next;
  context = {
    user: {
      id: next.user, identityUid: "contact-test-" + next.user,
      platformStatus: "ACTIVE", systemRoles: [],
    },
    membership: {
      id: next.membership, collegeId: SEED_IDS.collegeA,
      organizationId: SEED_IDS.organization,
      status: "ACTIVE", roles: ["LEARNER"],
    },
  };
  // Alternate contact is only permitted when a distinct primary login phone exists.
  const primaryPhone="+919"+Number.parseInt(next.user.slice(0,7),16).toString().padStart(9,"0");
  await pool.query(
    "INSERT INTO users(id,identity_uid,display_name,phone_e164) VALUES($1,$2,$3,$4)",
    [next.user, context.user.identityUid, "Profile contact test " + next.user,primaryPhone],
  );
  await pool.query(
    "INSERT INTO college_memberships(id,user_id,college_id,status) VALUES($1,$2,$3,'ACTIVE')",
    [next.membership,next.user,SEED_IDS.collegeA],
  );
  await pool.query(
    "INSERT INTO membership_roles(id,membership_id,role) VALUES($1,$2,'LEARNER')",
    [next.role,next.membership],
  );
}, 30_000);

afterEach(async () => {
  if (!ids) return;
  const owned = ids;
  ids = null;
  context = null;
  // Inverse FK order, including audit events created inside the write.
  try {
    await pool.query(
      "DELETE FROM activity_events WHERE actor_membership_id=$1 AND event_type='identity.learner_contact.updated'",
      [owned.membership],
    );
    await pool.query("DELETE FROM learner_profiles WHERE membership_id=$1", [owned.membership]);
    await pool.query("DELETE FROM membership_roles WHERE membership_id=$1", [owned.membership]);
    await pool.query("DELETE FROM college_memberships WHERE id=$1", [owned.membership]);
    await pool.query("DELETE FROM users WHERE id=$1", [owned.user]);
  } catch (error) {
    throw error;
  }
}, 30_000);
afterAll(async () => {
  await pool.end();
  await closeDatabaseConnection();
}, 30_000);

function own() {
  if (!context || !ids) throw new Error("Learner test fixture was not created");
  return { context, ids };
}

describe("Learner contact-only PATCH succeeds and denies in PostgreSQL", () => {
  it("persists validated contacts, preserves other sections and audits without PII", async () => {
    const { context: learner, ids: keys } = own();
    // A test-specific saved profile section must survive the contacts PATCH.
    await pool.query(
      "INSERT INTO learner_profiles(membership_id,profile_document) VALUES($1,$2::jsonb)",
      [keys.membership, JSON.stringify({
        headline: "My original headline",
        contacts: { alternatePhone: "", contactEmail: "" },
        skills: [{ id: randomUUID(), name: "TypeScript", proficiency: "Advanced" }],
      })],
    );
    const saved = await updateOwnLearnerContacts(learner, {
      confirmed: true,
      contacts: {
        alternatePhone: "+91 9876543210",
        contactEmail: "  edit." + keys.user.slice(0, 8) + "@example.test ",
      },
    });
    expect(saved.contacts.alternatePhone).toBe("+91 9876543210");
    expect(saved.contacts.contactEmail).toBe("edit." + keys.user.slice(0, 8) + "@example.test");
    const profile = await pool.query<{ profile_document: {
      contacts: { alternatePhone: string; contactEmail: string };
      headline: string; skills: Array<{name:string}>;
    } }>(
      "SELECT profile_document FROM learner_profiles WHERE membership_id=$1", [keys.membership],
    );
    expect(profile.rows[0]?.profile_document).toMatchObject({
      headline: "My original headline",
      contacts: saved.contacts,
      skills: [expect.objectContaining({ name: "TypeScript" })],
    });
    const primary = await pool.query<{ phone_e164: string | null; email: string | null }>(
      "SELECT phone_e164,email FROM users WHERE id=$1", [keys.user],
    );
    expect(primary.rows[0]).toEqual({
      phone_e164: "+919"+Number.parseInt(keys.user.slice(0,7),16).toString().padStart(9,"0"),
      email: null,
    });

    const events = await pool.query<{
      event_type:string;actor_user_id:string;actor_membership_id:string|null;
      college_id:string|null;metadata:Record<string,unknown>;
    }>(
      "SELECT event_type,actor_user_id,actor_membership_id,college_id,metadata FROM activity_events WHERE actor_membership_id=$1 AND event_type=$2",
      [keys.membership, "identity.learner_contact.updated"],
    );
    expect(events.rows).toHaveLength(1);
    expect(events.rows[0]).toMatchObject({
      event_type:"identity.learner_contact.updated",
      actor_user_id:keys.user,
      actor_membership_id:keys.membership,
      college_id:SEED_IDS.collegeA,
    });
    expect(JSON.stringify(events.rows[0]?.metadata)).not.toContain("edit.");
    expect(JSON.stringify(events.rows[0]?.metadata)).not.toContain("9876543210");
  });

  it("denies forged college, suspended membership and wrong-role without changing data", async () => {
    const { context: learner, ids: keys } = own();
    const forged: RequestContext = {
      ...learner, membership: { ...learner.membership!, collegeId: SEED_IDS.collegeB },
    };
    const suspended: RequestContext = {
      ...learner, membership: { ...learner.membership!, status: "SUSPENDED" },
    };
    const wrongRole: RequestContext = {
      ...learner, membership: { ...learner.membership!, roles: ["FACULTY"] },
    };
    for (const invalid of [forged, suspended, wrongRole]) {
      await expect(updateOwnLearnerContacts(invalid, {
        confirmed: true,
        contacts: { alternatePhone: "9876543210", contactEmail: "wrong@example.test" },
      })).rejects.toBeInstanceOf(AuthorizationError);
    }
    const profile = await pool.query(
      "SELECT membership_id FROM learner_profiles WHERE membership_id=$1", [keys.membership],
    );
    expect(profile.rowCount).toBe(0);
    const audit = await pool.query(
      "SELECT id FROM activity_events WHERE actor_membership_id=$1 AND event_type=$2",
      [keys.membership, "identity.learner_contact.updated"],
    );
    expect(audit.rowCount).toBe(0);
  });

  it("denies live suspension and role removal even when request context is stale", async () => {
    const { context: learner, ids: keys } = own();
    const edit = {
      confirmed: true,
      contacts: { alternatePhone: "", contactEmail: "test@example.test" },
    };
    await pool.query("UPDATE college_memberships SET status='SUSPENDED' WHERE id=$1", [keys.membership]);
    await expect(updateOwnLearnerContacts(learner, edit))
      .rejects.toBeInstanceOf(AuthorizationError);
    await pool.query("UPDATE college_memberships SET status='ACTIVE' WHERE id=$1", [keys.membership]);
    await pool.query("DELETE FROM membership_roles WHERE id=$1", [keys.role]);
    await expect(updateOwnLearnerContacts(learner, edit))
      .rejects.toBeInstanceOf(AuthorizationError);
    const saved = await pool.query("SELECT membership_id FROM learner_profiles WHERE membership_id=$1", [keys.membership]);
    expect(saved.rowCount).toBe(0);
  });

  it("rejects unconfirmed, login email, impersonation and invalid phone without writes", async () => {
    const { context: learner, ids: keys } = own();
    for (const input of [
      { confirmed: false, contacts: { alternatePhone: "", contactEmail: "" } },
      { confirmed: true, contacts: { alternatePhone: "1", contactEmail: "not-an-email" } },
      { confirmed: true, contacts: { alternatePhone: "", contactEmail: "", primaryEmail: "wrong@example.test" } },
      { confirmed: true, contacts: { alternatePhone: "", contactEmail: "" }, membershipId: randomUUID() },
    ]) {
      await expect(updateOwnLearnerContacts(learner, input)).rejects.toBeDefined();
    }
    const row = await pool.query(
      "SELECT profile_document FROM learner_profiles WHERE membership_id=$1", [keys.membership],
    );
    expect(row.rowCount).toBe(0);
  });
});
