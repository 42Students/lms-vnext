import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import { resolveMx } from "node:dns/promises";
import { publicJoinTablesReady } from "@/modules/placements/public-join/readiness";
import { lookupDeliveredJoinCompanyName, requestPublicJoinCode } from "@/modules/placements/public-join/send-code-service";

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));
vi.mock("node:dns/promises", () => ({ resolveMx: vi.fn() }));
vi.mock("@/modules/placements/public-join/readiness", () => ({ publicJoinTablesReady: vi.fn() }));

beforeEach(() => vi.resetAllMocks());
afterEach(() => vi.unstubAllEnvs());

describe("chat-16 public recruiter OTP accepted before optional company hint", () => {
  it("REC-JOIN-DELIVERY-06 retrieves only active company hint scoped by normalized registrable domain", async () => {
    let predicate: unknown = null;
    const limit = vi.fn(async () => [{ name: "Verified Company" }]);
    const where = vi.fn((sql: unknown) => {
      predicate = sql;
      return { limit };
    });
    const select = vi.fn(() => ({ from: vi.fn(() => ({ where })) }));
    vi.mocked(getDb).mockReturnValue({ select } as never);
    expect(await lookupDeliveredJoinCompanyName("recruiter@team.example.org"))
      .toBe("Verified Company");
    const sql = new PgDialect().sqlToQuery(predicate as never);
    expect(sql.params).toContain("example.org");
    expect(sql.params).toContain("ACTIVE");
    expect(limit).toHaveBeenCalledWith(1);
  });

  it("REC-JOIN-DELIVERY-07 company lookup outage cannot falsely report a failed already-delivered OTP", async () => {
    vi.mocked(getDb).mockReturnValue({
      select: vi.fn(() => {
        throw new Error("private company directory outage");
      }),
    } as never);
    expect(await lookupDeliveredJoinCompanyName("recruiter@team.example.org"))
      .toBeNull();
  });

  it("REC-JOIN-DELIVERY-08 invalid or personal email cannot query company directory", async () => {
    expect(await lookupDeliveredJoinCompanyName("not-an-email")).toBeNull();
    expect(await lookupDeliveredJoinCompanyName("personal@gmail.com")).toBeNull();
    expect(getDb).not.toHaveBeenCalled();
  });

  it("REC-JOIN-DELIVERY-09 unrecognized company returns a null hint, never invents an employer", async () => {
    const select = vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => []),
        })),
      })),
    }));
    vi.mocked(getDb).mockReturnValue({ select } as never);
    expect(await lookupDeliveredJoinCompanyName("recruiter@team.example.org"))
      .toBeNull();
  });
  it("REC-JOIN-DELIVERY-10 returns success after delivered challenge even when optional company lookup fails", async () => {
    const linkId = "11111111-1111-4111-8111-111111111111";
    vi.stubEnv("TPO_RECRUITER_OTP_HMAC_SECRET", "secure-network-code-secret".repeat(2));
    vi.mocked(publicJoinTablesReady).mockResolvedValue(true);
    vi.mocked(resolveMx).mockResolvedValue([
      { exchange: "mx.example.org", priority: 10 },
    ]);
    const returned = [
      [{ id: linkId, domain: "example.org" }],
      [{ n: 0 }], [{ n: 0 }],
    ];
    const selectInTransaction = vi.fn(() => {
      const rows = returned.shift() ?? [];
      const query = {
        innerJoin: vi.fn(), where: vi.fn(), for: vi.fn(),
        limit: vi.fn(async () => rows),
        then: (resolve: (rows: unknown) => unknown, reject?: (error: unknown) => unknown) =>
          Promise.resolve(rows).then(resolve, reject),
      };
      query.innerJoin.mockReturnValue(query);
      query.where.mockReturnValue(query);
      query.for.mockReturnValue(query);
      return { from: vi.fn(() => query) };
    });
    const returning = vi.fn(async () => [{ id: "22222222-2222-4222-8222-222222222222" }]);
    const tx = {
      select: selectInTransaction,
      insert: vi.fn(() => ({ values: vi.fn(() => ({ returning })) })),
      execute: vi.fn(async () => ({ rows: [{ n: 0 }] })),
    };
    const db = {
      execute: vi.fn(async () => ({ rows: [{ ready: true }] })),
      transaction: vi.fn(async (fn: (value: typeof tx) => Promise<unknown>) => fn(tx)),
      select: vi.fn()
        .mockImplementationOnce(() => {
          const preflight = {
            innerJoin: vi.fn(), where: vi.fn(),
            limit: vi.fn(async () => [{ id: linkId, domain: "example.org" }]),
          };
          preflight.innerJoin.mockReturnValue(preflight);
          preflight.where.mockReturnValue(preflight);
          return { from: vi.fn(() => preflight) };
        })
        .mockImplementation(() => { throw new Error("company directory outage"); }),
    };
    vi.mocked(getDb).mockReturnValue(db as never);
    const deliver = vi.fn(async (_email: string, _code: string) => true);
    const result = await requestPublicJoinCode(
      "COMPANY",
      { token: "a".repeat(64), email: "recruiter@team.example.org" },
      "198.51.100.12",
      deliver,
    );
    expect(result).toEqual({ sent: true, companyName: null });
    expect(deliver).toHaveBeenCalledTimes(1);
    expect(deliver.mock.calls[0]?.[0]).toBe("recruiter@team.example.org");
    expect(deliver.mock.calls[0]?.[1]).toMatch(/^[0-9]{6}$/);
    expect(tx.insert).toHaveBeenCalledTimes(1);
    expect(db.select).toHaveBeenCalledTimes(2);
  });

  it("REC-JOIN-MX-11 invalid link is denied before any externally observable DNS, challenge or email", async () => {
    vi.stubEnv("TPO_RECRUITER_OTP_HMAC_SECRET", "secure-network-code-secret".repeat(2));
    vi.mocked(publicJoinTablesReady).mockResolvedValue(true);
    const limit = vi.fn(async () => []);
    const builder = { innerJoin: vi.fn(), where: vi.fn(), limit };
    builder.innerJoin.mockReturnValue(builder);
    builder.where.mockReturnValue(builder);
    const select = vi.fn(() => ({ from: vi.fn(() => builder) }));
    const transaction = vi.fn();
    vi.mocked(getDb).mockReturnValue({
      execute: vi.fn(async () => ({ rows: [{ ready: true }] })),
      select, transaction,
    } as never);
    const deliver = vi.fn(async (_address: string, _otp: string) => true);
    await expect(requestPublicJoinCode(
      "COMPANY",
      { token: "a".repeat(64), email: "recruiter@team.example.org" },
      "198.51.100.12", deliver,
    )).rejects.toMatchObject({ code: "INVALID_LINK" });
    expect(select).toHaveBeenCalledTimes(1);
    expect(limit).toHaveBeenCalledWith(1);
    expect(resolveMx).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
    expect(deliver).not.toHaveBeenCalled();
  });

});
