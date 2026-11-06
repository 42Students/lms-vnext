import { describe, expect, it } from "vitest";
import { exportedMethods, handlerBody, read, rel, routeFiles } from "./phase3-scan-helpers";

/**
 * /api/internal/* has no browser session, so each handler must authenticate its
 * caller with a shared secret (timing-safe compare) or a provider signature
 * BEFORE doing any work. A new internal route that skips this fails here.
 */
const INTERNAL = routeFiles("src/app/api/internal").map((p) => ({ file: rel(p), src: read(p) }));

const CREDENTIAL_CHECK =
  /internalRoute\(|timingSafeEqual|verify\w*Signature|verifyInbound|validWebhookSecret|constantTimeEqual|\bhmac\b|x-[a-z-]*(?:key|signature|secret)/i;

/** Routes that authenticate in a delegated module; the delegate is asserted below. */
const DELEGATED: Record<string, { delegate: string; reason: string }> = {
  "src/app/api/internal/placements/recruiter-message-inbound/route.ts": {
    delegate: "src/app/api/internal/placements/recruiter-message-inbound/route.ts",
    reason: "x-recruiter-mail-signature HMAC is verified in the same file before ingestion.",
  },
};

describe("Phase 3: internal scheduler and inbound routes authenticate their callers", () => {
  it("finds the internal route set", () => {
    expect(INTERNAL.length).toBeGreaterThanOrEqual(10);
  });

  it("every internal route file performs a credential check", () => {
    const missing = INTERNAL.filter(({ file, src }) => {
      if (exportedMethods(src).length === 0) return false;
      if (CREDENTIAL_CHECK.test(src)) return false;
      const d = DELEGATED[file];
      return !(d && CREDENTIAL_CHECK.test(read(d.delegate)));
    }).map((r) => r.file);
    expect(missing, `internal routes without a credential check: ${missing.join(", ")}`).toEqual([]);
  });

  it("each internal handler rejects before touching the database or running work", () => {
    const bad: string[] = [];
    for (const { file, src } of INTERNAL) {
      for (const method of exportedMethods(src)) {
        const body = handlerBody(src, method);
        if (!body) continue;
        const check = body.search(CREDENTIAL_CHECK);
        // A credential check may sit in a helper called first; require that no
        // database access or scheduler call precedes the first check in the file.
        const work = body.search(/getDb\(\)|runAlertTick\(|release[A-Z]\w*\(|deliver[A-Z]\w*\(/);
        if (check !== -1 && work !== -1 && work < check) bad.push(`${file} ${method}`);
      }
    }
    expect(bad, `work before authentication: ${bad.join(", ")}`).toEqual([]);
  });

  it("secret comparisons are constant-time where a shared secret is used", () => {
    const risky = INTERNAL.filter(({ src }) =>
      /(?:secret|key|token)\w*\s*(?:===|!==)\s*|(?:===|!==)\s*\w*(?:secret|Secret|Key|Token)\b/.test(src) &&
      !/timingSafeEqual/.test(src),
    ).map((r) => r.file);
    expect(risky, `plain === comparison against a secret: ${risky.join(", ")}`).toEqual([]);
  });

  it("failed authentication never reveals which part was wrong", () => {
    for (const { file, src } of INTERNAL) {
      expect(src, `${file} leaks a secret name in an error`).not.toMatch(/Invalid (?:secret|key|token)[^"']*(?:expected|should be)/i);
    }
  });

  it("the delegation list only names files that exist", () => {
    for (const [file, { delegate, reason }] of Object.entries(DELEGATED)) {
      expect(INTERNAL.some((r) => r.file === file), `${file} no longer exists`).toBe(true);
      expect(reason.length).toBeGreaterThan(20);
      expect(read(delegate).length).toBeGreaterThan(0);
    }
  });
});
