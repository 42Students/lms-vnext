import { readFileSync } from "node:fs";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { users } from "@/db/schema";
import { containsLikePattern, equalsIgnoreCase, escapeLikeLiteral } from "@/lib/sql-match";

const dialect = new PgDialect();

describe("T-SEC-01 wildcard-safe matching", () => {
  it("equalsIgnoreCase compiles to lower() equality with the value bound as a parameter", () => {
    const q = dialect.sqlToQuery(equalsIgnoreCase(users.email, "a_b%@x.com"));
    expect(q.sql).toMatch(/lower\(.*email.*\) = lower\(\$1\)/);
    expect(q.sql).not.toMatch(/like/i);
    expect(q.params).toEqual(["a_b%@x.com"]);
  });
  it("escapes %, _ and backslash", () => {
    expect(escapeLikeLiteral("a_b%c\\d")).toBe("a\\_b\\%c\\\\d");
    expect(containsLikePattern("100%_")).toBe("%100\\%\\_%");
  });
  it("recruiter grant and invite lookups no longer ilike the raw email", () => {
    for (const f of ["tpo-recruiter-grant-write-service", "recruiter-service"]) {
      const src = readFileSync(`src/modules/placements/${f}.ts`, "utf8");
      expect(src).not.toMatch(/ilike\(users\.email,\s*input\.email\)/);
    }
    const members = readFileSync("src/modules/projects/member-service.ts", "utf8");
    expect(members).not.toContain("`%${query.q}%`");
  });
});
