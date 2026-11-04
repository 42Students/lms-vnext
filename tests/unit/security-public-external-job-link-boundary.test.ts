import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ getDb: vi.fn() }));

import { getDb } from "@/db/client";
import {
  readPublicExternalJobShare,
} from "@/modules/placements/tpo-public-join-link-service";

const slug = "smr-0123456789abcdef";
const activeJob = {
  id: "11111111-1111-4111-8111-111111111111",
  collegeId: "22222222-2222-4222-8222-222222222222",
  linkId: "33333333-3333-4333-8333-333333333333",
  title: "Example published job",
  description: "Public role details",
  applicationMode: "EXTERNAL_ONLY",
  externalApplicationUrl: "https://careers.example.test/apply",
  applicationDeadline: null,
  companyName: "Example employer",
};

type JobRow = typeof activeJob;

function mockPublicJobTransaction({
  rows = [activeJob],
  updated = true,
}: { rows?: JobRow[]; updated?: boolean } = {}) {
  let readPredicate: unknown = null;
  let updatePredicate: unknown = null;
  const joins = vi.fn();
  const selectChain = {
    innerJoin: vi.fn(() => selectChain),
    where: vi.fn((predicate: unknown) => {
      readPredicate = predicate;
      return selectChain;
    }),
    limit: vi.fn(async () => rows),
  };
  const read = vi.fn(() => ({ from: vi.fn(() => selectChain) }));
  const writeChain = {
    returning: vi.fn(async () => updated ? [{ id: activeJob.linkId }] : []),
  };
  const where = vi.fn((predicate: unknown) => {
    updatePredicate = predicate;
    return writeChain;
  });
  const update = vi.fn(() => ({ set: vi.fn(() => ({ where })) }));
  vi.mocked(getDb).mockReturnValue({
    transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({
      select: read,
      update,
    }),
  } as never);
  return { joins, selectChain, read, update, readPredicate: () => readPredicate, updatePredicate: () => updatePredicate };
}

beforeEach(() => vi.resetAllMocks());

describe("SEC-05 public external placement job bearer-link isolation", () => {
  it("rejects malformed slugs before opening a database transaction", async () => {
    await expect(readPublicExternalJobShare("not-an-invite")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(getDb).not.toHaveBeenCalled();
  });

  it("enforces ACTIVE college and organization state in the database lookup", async () => {
    const tx = mockPublicJobTransaction();
    await expect(readPublicExternalJobShare(slug)).resolves.toMatchObject({
      job: { title: activeJob.title, companyName: activeJob.companyName },
    });
    const query = new PgDialect().sqlToQuery(tx.readPredicate() as never);
    expect(query.sql).toContain('"colleges"."status"');
    expect(query.sql).toContain('"organizations"."status"');
    expect(query.params).toContain("ACTIVE");
    expect(query.params.filter((item) => item === "ACTIVE")).toHaveLength(4);
    // In addition to tenant lifecycle, only published external/hybrid jobs
    // with active employer relationship and a non-revoked link are exposed.
    expect(query.params).toContain("PUBLISHED");
    expect(query.params).toContain(slug);
    expect(tx.selectChain.innerJoin).toHaveBeenCalledTimes(4);
  });

  it("returns no details when the link, job, employer or tenant lookup is denied", async () => {
    const tx = mockPublicJobTransaction({ rows: [] });
    await expect(readPublicExternalJobShare(slug)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(tx.update).not.toHaveBeenCalled();
  });

  it("rechecks link revocation before returning previously selected details", async () => {
    const tx = mockPublicJobTransaction({ updated: false });
    await expect(readPublicExternalJobShare(slug)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const update = new PgDialect().sqlToQuery(tx.updatePredicate() as never);
    expect(update.sql).toContain('"placement_public_external_job_links"."revoked_at"');
    expect(update.sql.toLowerCase()).toContain("is null");
    expect(update.params).toContain(activeJob.linkId);
  });
});
