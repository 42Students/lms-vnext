import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import { lookupDeliveredJoinCompanyName } from "@/modules/placements/public-join/send-code-service";

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));

beforeEach(() => vi.resetAllMocks());

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
});
