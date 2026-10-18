import { beforeEach, describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import { getDb } from "@/db/client";
import { getCollegeSignInName } from "@/modules/auth/tenant-branding";

vi.mock("@/db/client", () => ({ getDb: vi.fn() }));
const college = "11111111-1111-4111-8111-111111111111";
function fakeDb(data: readonly { name: string }[]) {
  let predicate: unknown;
  const limit = vi.fn(async () => data);
  const where = vi.fn((value: unknown) => {
    predicate = value;
    return { limit };
  });
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));
  vi.mocked(getDb).mockReturnValue({ select } as never);
  return { select, limit, condition: () => predicate };
}
beforeEach(() => vi.resetAllMocks());

describe("chat-16 college-host sign-in metadata tenant isolation", () => {
  it("AUTH-TENANT-BRANDING-01 returns the active college label under exact UUID scope", async () => {
    const db = fakeDb([{ name: "IIT Dharwad" }]);
    expect(await getCollegeSignInName(college)).toBe("IIT Dharwad");
    expect(db.limit).toHaveBeenCalledWith(1);
    const sql = new PgDialect().sqlToQuery(db.condition() as never);
    expect(sql.params).toContain(college);
    expect(sql.params).toContain("ACTIVE");
    expect(sql.sql).toContain("college");
  });

  it("AUTH-TENANT-BRANDING-02 hidden/disabled college does not inherit a platform label", async () => {
    const db = fakeDb([]);
    expect(await getCollegeSignInName(college)).toBeNull();
    expect(db.select).toHaveBeenCalledTimes(1);
  });

  it("AUTH-TENANT-BRANDING-03 DB outage propagates instead of masquerading as unknown campus", async () => {
    const select = vi.fn(() => {
      throw new Error("database disconnected");
    });
    vi.mocked(getDb).mockReturnValue({ select } as never);
    await expect(getCollegeSignInName(college)).rejects.toThrow("database disconnected");
  });
});
