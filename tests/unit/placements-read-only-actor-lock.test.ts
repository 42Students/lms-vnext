import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// requireTpoJobActor takes SELECT FOR SHARE, which Postgres rejects in read-only transactions.
describe("TPO actor checks", () => {
  it("never run inside a read-only transaction", () => {
    const dir = join(process.cwd(), "src/modules/placements");
    const offenders = readdirSync(dir).filter((f) => f.endsWith(".ts")).filter((f) =>
      /requireTpoJobActor\(tx,context\)[;)}\s]*(?:return [^;]*;\s*\}\s*)?,\s*\{accessMode:"read only"\}/.test(readFileSync(join(dir, f), "utf8")));
    expect(offenders).toEqual([]);
  });
});
