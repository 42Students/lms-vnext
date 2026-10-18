import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { Pool } from "pg";
import { getDb, closeDatabaseConnection } from "@/db/client";
import { inboundMailMessages } from "@/db/schema/inbound-mail";
import {
  changeInboundMailStatusForAdmin,
  listInboundMailForAdmin,
} from "@/modules/inbound-mail/admin-service";
import type { RequestContext } from "@/modules/identity/context";
import { assertDb018DisposableTarget } from "../support/db018-test-target.mjs";

const enabled = Boolean(process.env.TEST_DATABASE_URL) &&
  process.env.DB03_ISOLATED_TEST_DATABASE === "1" &&
  process.env.TEST_DATABASE_URL === process.env.DATABASE_URL;
if (enabled) assertDb018DisposableTarget(process.env, { serviceBound: true });

const pool = enabled ? new Pool({
  connectionString: process.env.TEST_DATABASE_URL,
  max: 2,
}) : null;

const globalAdmin: RequestContext = {
  user: { id: randomUUID(), identityUid: "chat16-inbound-actor",
    platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
  membership: null,
};

const created: string[] = [];
type RawMail = { status: string; version: number };

async function seedMail() {
  const id = randomUUID();
  await getDb().insert(inboundMailMessages).values({
    id,
    sourceMessageId: "chat16-triage-" + id,
    collegeId: null,
    fromAddress: "sender@example.org",
    toAddress: "secure-inbox@example.org",
    subject: "Triage concurrency fixture",
    bodyPlain: "Private fixture for optimistic-lock tests",
    receivedAt: new Date("2026-10-18T00:00:00.000Z"),
    status: "NEW",
    version: 0,
  });
  created.push(id);
  return id;
}

async function loadMail(id: string): Promise<RawMail | undefined> {
  const result = await pool!.query<RawMail>(
    "select status,version from inbound_mail_messages where id=$1::uuid", [id],
  );
  return result.rows[0];
}

describe.skipIf(!enabled)("chat-16 PostgreSQL inbound triage authorization and CAS", () => {
  afterAll(async () => {
    try {
      for (const id of created) {
        await pool!.query("delete from inbound_mail_messages where id=$1::uuid", [id]);
      }
    } finally {
      await pool?.end();
      await closeDatabaseConnection();
    }
  });

  it("INBOUND-TRIAGE-PG-16 permits exactly one of two concurrent NEW to TRIAGED writes", async () => {
    const id = await seedMail();
    const command = {
      id, expectedStatus: "NEW", expectedVersion: 0, status: "TRIAGED",
    };
    const attempts = await Promise.all([
      changeInboundMailStatusForAdmin(globalAdmin, command),
      changeInboundMailStatusForAdmin(globalAdmin, command),
    ]);
    expect(attempts.filter(x => x.kind === "UPDATED")).toHaveLength(1);
    expect(attempts.filter(x => x.kind === "STALE")).toHaveLength(1);
    expect(await loadMail(id)).toMatchObject({ status: "TRIAGED", version: 1 });
    const replay = await changeInboundMailStatusForAdmin(globalAdmin, command);
    expect(replay).toEqual({ kind: "STALE" });
  });

  it("INBOUND-TRIAGE-PG-17 preserves version across completion, denied shortcut and reopen", async () => {
    const id = await seedMail();
    const close = await changeInboundMailStatusForAdmin(globalAdmin, {
      id, expectedStatus: "NEW", expectedVersion: 0, status: "RESOLVED",
    });
    expect(close).toMatchObject({ kind: "UPDATED", status: "RESOLVED", version: 1 });
    await expect(changeInboundMailStatusForAdmin(globalAdmin, {
      id, expectedStatus: "RESOLVED", expectedVersion: 1, status: "TRIAGED",
    })).rejects.toThrow("Unsupported inbound mail transition");
    expect(await loadMail(id)).toMatchObject({ status: "RESOLVED", version: 1 });
    const reopen = await changeInboundMailStatusForAdmin(globalAdmin, {
      id, expectedStatus: "RESOLVED", expectedVersion: 1, status: "NEW",
    });
    expect(reopen).toMatchObject({ kind: "UPDATED", status: "NEW", version: 2 });
    expect(await loadMail(id)).toMatchObject({ status: "NEW", version: 2 });
  });

  it("INBOUND-TRIAGE-PG-18 denies acting-college and inactive or wrong-role sessions before mutation", async () => {
    const id = await seedMail();
    const command = {
      id, expectedStatus: "NEW", expectedVersion: 0, status: "TRIAGED",
    };
    const unauthorized: RequestContext[] = [
      { ...globalAdmin, adminScope: { organizationId: randomUUID(), collegeId: null } },
      { ...globalAdmin, user: { ...globalAdmin.user, systemRoles: [] } },
      { ...globalAdmin, user: { ...globalAdmin.user, platformStatus: "DISABLED" } },
    ];
    for (const actor of unauthorized) {
      await expect(changeInboundMailStatusForAdmin(actor, command)).rejects.toThrow();
      await expect(listInboundMailForAdmin(actor, {})).rejects.toThrow();
    }
    expect(await loadMail(id)).toEqual({ status: "NEW", version: 0 });
  });
});
