import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error plain ESM script without types
import { scanDirs, scanText, secretLiteralsFromEnv } from "../../scripts/security/scan-built-bundles.mjs";

const dirs: string[] = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});
const temp = () => {
  const d = mkdtempSync(join(tmpdir(), "bundle-scan-"));
  dirs.push(d);
  return d;
};

describe("SEC-09/12 built bundle secret scan", () => {
  it("passes ordinary application code", () => {
    expect(scanText("export const x = fetch('/api/hello'); const a = 'Bearer ' + token;")).toEqual([]);
  });

  it("flags private keys, cloud tokens and database URLs with a password", () => {
    const rules = (text: string) => scanText(text).map((f: { rule: string }) => f.rule);
    expect(rules("-----BEGIN PRIVATE KEY-----\nabc")).toContain("private-key-block");
    expect(rules("key=AKIAABCDEFGHIJKLMNOP")).toContain("aws-access-key-id");
    expect(rules("t='ghp_" + "a".repeat(36) + "'")).toContain("github-token");
    expect(rules("u='postgres://app:hunter22pw@10.0.0.3:5432/db'")).toContain("database-url-with-password");
    expect(rules("process.env.NEXT_PUBLIC_API_SECRET")).toContain("sensitive-public-name");
  });

  it("never prints the whole secret, only a masked sample", () => {
    const [finding] = scanText("x='ghp_" + "b".repeat(36) + "'");
    expect(finding.sample.length).toBeLessThan(12);
    expect(finding.sample).not.toContain("b".repeat(10));
  });

  it("finds an exact environment secret value shipped in a file", () => {
    const secret = "S3cretValueThatIsLongEnough_1234567890";
    const dir = temp();
    mkdirSync(join(dir, "static"));
    writeFileSync(join(dir, "static", "chunk.js"), "var a='" + secret + "';");
    writeFileSync(join(dir, "static", "clean.js"), "var b=1;");
    const literals = secretLiteralsFromEnv({ AUTH_SECRET: secret, SHORT_TOKEN: "short", NODE_ENV: "production" });
    expect(literals).toEqual([secret]);
    const { scanned, results } = scanDirs([dir], literals);
    expect(scanned).toBe(2);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ file: expect.stringContaining("chunk.js"), rule: "secret-value-in-bundle" });
  });
});
