import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import snapshot from "../../docs/audit/graceful/raw-error-allowlist.json";

const baseline: Record<string, string> = snapshot.files;
function allComponentFiles(root = "src/components"): string[] {
  const output: string[] = [];
  for (const item of readdirSync(root, { withFileTypes: true })) {
    const name = path.posix.join(root, item.name);
    if (item.isDirectory()) output.push(...allComponentFiles(name));
    else if (/\.tsx?$/.test(name)) output.push(name);
  }
  return output;
}
function blobHash(content: string) {
  return createHash("sha1").update(`blob ${Buffer.byteLength(content)}\0`).update(content).digest("hex");
}
const rawErrorPatterns = [
  /\{\s*(?:result|body)\.error\b/,
  /\{\s*reason\.message\b/,
  // A local Zod issue tree is field-validation data, not a server error code.
  // Keep direct result.error assignments forbidden, including optional chaining.
  /set(?:Error|Notice)\(\s*(?:result|body)\.error\b(?!\s*\.)/,
  /set(?:Error|Notice)\(\s*reason\.message\b/,
  /set(?:Error|Notice)\(\s*["'][A-Z][A-Z0-9_]{5,}["']/,
  /\{\s*["'][A-Z][A-Z0-9_]{5,}["']\s*\}/,
  /<(?:p|div|span|small|strong|label|h[1-6])[^>]*>\s*[A-Z][A-Z0-9_]{5,}\s*</,
];
const mutatingFetch = /fetch\([\s\S]{0,350}?\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/;

describe("new raw-error and mutation regression gate", () => {
  it("GR-09 rejects new renderings of API codes or internal error messages", () => {
    const offenders = allComponentFiles().filter((file) => {
      const content = readFileSync(file, "utf8");
      const leaks = rawErrorPatterns.some((pattern) => pattern.test(content));
      return leaks && blobHash(content) !== baseline[file];
    });
    expect(offenders, `New unsafe error rendering in: ${offenders.join(", ")}`).toEqual([]);
  });
  it("GR-09 distinguishes direct raw API errors from client Zod issue details", () => {
    const pattern = rawErrorPatterns[2];
    expect(pattern.test('setNotice(result.error)')).toBe(true);
    expect(pattern.test('setError(body.error)')).toBe(true);
    expect(pattern.test('setNotice(result.error.issues[0]?.message)')).toBe(false);
  });
  it("GR-31 inventories newly changed unguarded mutating components", () => {
    const offenders = allComponentFiles().filter((file) => {
      const content = readFileSync(file, "utf8");
      return mutatingFetch.test(content) && !content.includes("useGuardedAction(") &&
        blobHash(content) !== baseline[file];
    });
    expect(offenders, `Mutating fetch without useGuardedAction: ${offenders.join(", ")}`).toEqual([]);
  });
});
