import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ getDb: vi.fn() }));

import { getDb } from "@/db/client";
import { readPublicExternalJob } from "@/modules/placements/public-external-job-service";

const slug = "smr-0123456789abcdef";
const row = {
  collegeId: "22222222-2222-4222-8222-222222222222",
  jobTitle: "Example published job",
  roleDescription: "Public role details",
  workMode: "REMOTE",
  applicationMode: "EXTERNAL_ONLY",
  externalUrl: "https://careers.example.test/apply",
  companyName: "Example employer",
};

function mockExternalJobPage({
  rows = [row],
  updated = true,
}: { rows?: typeof row[]; updated?: boolean } = {}) {
  let readPredicate: unknown;
  let updatePredicate: unknown;
  const limit = vi.fn(async () => rows);
  const innerJoin = vi.fn();
  const selectChain = {
    innerJoin,
    where: vi.fn((predicate: unknown) => {
      readPredicate = predicate;
      return { limit };
    }),
  };
  innerJoin.mockReturnValue(selectChain);
  const select = vi.fn(() => ({ from: vi.fn(() => selectChain) }));
  const returning = vi.fn(async () => updated ? [{ id: slug }] : []);
  const update = vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn((predicate: unknown) => {
        updatePredicate = predicate;
        return { returning };
      }),
    })),
  }));
  vi.mocked(getDb).mockReturnValue({ select, update } as never);
  return { selectChain, update, readPredicate: () => readPredicate, updatePredicate: () => updatePredicate };
}

beforeEach(() => vi.resetAllMocks());

describe("SEC-05 alternate public external job page remains tenant bounded", () => {
  it("rejects guessed or malformed bearer slugs without database access", async () => {
    await expect(readPublicExternalJob("smr-123")).resolves.toBeNull();
    expect(getDb).not.toHaveBeenCalled();
  });

  it("requires an ACTIVE college and organization, published external job and active employer", async () => {
    const tx = mockExternalJobPage();
    await expect(readPublicExternalJob(slug)).resolves.toMatchObject({
      title: row.jobTitle, companyName: row.companyName,
      applyHref: row.externalUrl,
    });
    const q = new PgDialect().sqlToQuery(tx.readPredicate() as never);
    expect(q.sql).toContain('"colleges"."status"');
    expect(q.sql).toContain('"organizations"."status"');
    expect(q.params.filter((item) => item === "ACTIVE")).toHaveLength(4);
    expect(q.params).toContain("PUBLISHED");
    expect(q.params).toContain(slug);
    expect(tx.selectChain.innerJoin).toHaveBeenCalledTimes(4);
  });

  it("reveals nothing when an inactive tenant or unavailable link gives no row", async () => {
    const tx = mockExternalJobPage({ rows: [] });
    await expect(readPublicExternalJob(slug)).resolves.toBeNull();
    expect(tx.update).not.toHaveBeenCalled();
  });

  it("does not count a view or reveal job details if the destination URL is invalid", async () => {
    const tx = mockExternalJobPage({ rows: [{ ...row, externalUrl: "http://internal.test/" }] });
    await expect(readPublicExternalJob(slug)).resolves.toBeNull();
    expect(tx.update).not.toHaveBeenCalled();
  });

  it("returns no job data when a concurrent link revocation wins before view update", async () => {
    const tx = mockExternalJobPage({ updated: false });
    await expect(readPublicExternalJob(slug)).resolves.toBeNull();
    const q = new PgDialect().sqlToQuery(tx.updatePredicate() as never);
    expect(q.sql).toContain('"placement_public_external_job_links"."revoked_at"');
    expect(q.sql.toLowerCase()).toContain("is null");
    expect(q.params).toContain(slug);
  });
});
