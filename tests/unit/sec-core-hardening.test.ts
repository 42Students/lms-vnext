import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { sharedStoreEnabled } from "@/security/shared-store-flag";
import { assertTenantScopePoolingSafe, looksLikeTransactionPooler } from "@/db/pooling-guard";
import { redactLogFields, redactString } from "@/observability/redact";
import { createStructuredLogRecord } from "@/observability/logger";
import { attachmentDisposition, isInlineSafeContentType } from "@/modules/storage/inline-safe";
import {
  LOGIN_EMAIL_PER_IP_PER_MINUTE,
  LOGIN_ROLL_NUMBER_PER_IP_PER_MINUTE,
  LOGIN_START_PER_IP_PER_MINUTE,
  LOGIN_VERIFY_PER_IP_PER_MINUTE,
} from "@/modules/auth/ip-limits";

const root = process.cwd();
const read = (rel: string) => readFileSync(path.join(root, rel), "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

describe("1. rate limits hold across replicas", () => {
  it("defaults the shared store on in production and off elsewhere, with an explicit switch both ways", () => {
    expect(sharedStoreEnabled({ NODE_ENV: "production" })).toBe(true);
    expect(sharedStoreEnabled({ NODE_ENV: "production", SECURITY_SHARED_STORE: "off" })).toBe(false);
    expect(sharedStoreEnabled({ NODE_ENV: "development" })).toBe(false);
    expect(sharedStoreEnabled({ NODE_ENV: "test" })).toBe(false);
    expect(sharedStoreEnabled({ NODE_ENV: "development", SECURITY_SHARED_STORE: "on" })).toBe(true);
    expect(sharedStoreEnabled({})).toBe(false);
  });

  it("the shared-store module uses the same rule", () => {
    expect(read("src/security/shared-store.ts")).toContain("sharedStoreEnabled()");
  });
});

describe("2. a shared campus address is not a lockout", () => {
  it("per-address ceilings are coarse backstops, not 10 a minute", () => {
    for (const limit of [
      LOGIN_START_PER_IP_PER_MINUTE,
      LOGIN_VERIFY_PER_IP_PER_MINUTE,
      LOGIN_EMAIL_PER_IP_PER_MINUTE,
      LOGIN_ROLL_NUMBER_PER_IP_PER_MINUTE,
    ]) {
      expect(limit).toBeGreaterThanOrEqual(100);
      expect(limit).toBeLessThanOrEqual(1000);
    }
  });

  it("the sign-in routes use the shared constants, never a bare literal", () => {
    for (const file of [
      "src/app/api/auth/login/start/route.ts",
      "src/app/api/auth/login/verify/route.ts",
      "src/app/api/auth/login/email/route.ts",
      "src/app/api/auth/login/roll-number/start/route.ts",
    ]) {
      const source = read(file);
      expect(source, file).toContain("@/modules/auth/ip-limits");
      expect(source, file).not.toMatch(/guardLoginRequest\([^)]*,\s*\d+\s*\)/s);
    }
  });

  it("per-contact budgets stay strict and a college host gets a bigger per-address budget", () => {
    const service = read("src/modules/auth/login-service.ts");
    expect(service).toMatch(/MAX_SENDS_PER_CONTACT\s*=\s*5/);
    expect(service).toMatch(/MAX_SENDS_PER_CONTACT_TOTAL\s*=\s*8/);
    expect(service).toMatch(/MAX_SENDS_PER_ADDRESS\s*=\s*20/);
    expect(service).toMatch(/MAX_SENDS_PER_ADDRESS_ON_COLLEGE_HOST\s*=\s*600/);
    expect(service).toContain("input.tenantCollegeId");
    expect(service).toMatch(/one atomic budget of 5 verification tries/);
  });
});

describe("3. tenant settings are never used behind a transaction pooler", () => {
  it("recognises pooler addresses", () => {
    expect(looksLikeTransactionPooler("postgres://u:p@db.internal:6432/app")).toBe(true);
    expect(looksLikeTransactionPooler("postgres://u:p@aws-0-eu.pooler.supabase.com:6543/postgres")).toBe(true);
    expect(looksLikeTransactionPooler("postgres://u:p@host/app?pgbouncer=true")).toBe(true);
    expect(looksLikeTransactionPooler("postgres://u:p@abc.hyperdrive.local/app")).toBe(true);
    expect(looksLikeTransactionPooler("postgres://u:p@10.0.0.5:5432/app")).toBe(false);
    expect(looksLikeTransactionPooler("not a url")).toBe(false);
  });

  it("refuses to start with tenant scope on and a pooler address unless acknowledged", () => {
    const pooler = "postgres://u:p@db.internal:6432/app";
    expect(() => assertTenantScopePoolingSafe(pooler, { DB_TENANT_SCOPE: "on" })).toThrow(/transaction-mode pooler/);
    expect(() => assertTenantScopePoolingSafe(pooler, { DB_TENANT_SCOPE: "on", DB_ALLOW_TRANSACTION_POOLER: "acknowledged" })).not.toThrow();
    expect(() => assertTenantScopePoolingSafe(pooler, {})).not.toThrow();
    expect(() => assertTenantScopePoolingSafe("postgres://u:p@10.0.0.5:5432/app", { DB_TENANT_SCOPE: "on" })).not.toThrow();
  });

  it("the pool is created through the guard, and tenant settings are only written by the tenant context module", () => {
    expect(read("src/db/client.ts")).toContain("assertTenantScopePoolingSafe(");
    const offenders = walk(path.join(root, "src"))
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => /set_config\(\s*'app\./.test(readFileSync(f, "utf8")))
      .map((f) => path.relative(root, f).split(path.sep).join("/"))
      .filter((f) => f !== "src/db/tenant-context.ts");
    expect(offenders).toEqual([]);
  }, 60_000);
});

describe("5. sessions", () => {
  const session = read("src/modules/auth/session-service.ts");
  it("stores only a keyed digest of the token, never the token", () => {
    expect(session).toContain("credential_digest");
    expect(session).toContain("sessionDigest(config.secret, token)");
    expect(session).not.toMatch(/INSERT INTO identity_device_sessions\s*\([^)]*\btoken\b/);
  });
  it("re-checks the account and revocation on every request, with idle and absolute limits", () => {
    expect(session).toContain("revoked_at IS NULL");
    expect(session).toContain("expires_at > clock_timestamp()");
    expect(session).toContain("active_user");
    expect(session).toContain("SESSION_IDLE_TIMEOUT_SECONDS");
    expect(session).toContain("SUPER_ADMIN_ABSOLUTE_TIMEOUT_SECONDS");
  });
  it("replacing a session revokes the old one in the same step", () => {
    expect(read("src/app/api/auth/login/verify/route.ts")).toContain("previousToken: previousToken(request)");
  });
  it("session cookies are HttpOnly, SameSite and Secure in production", () => {
    const verify = read("src/app/api/auth/login/verify/route.ts");
    expect(verify).toContain("httpOnly: true");
    expect(verify).toContain('secure: process.env.NODE_ENV === "production"');
    expect(verify).toContain('sameSite: "lax"');
  });
});

describe("6. uploaded files are never served as active content", () => {
  it("only PDF, images, audio and video may render inline", () => {
    for (const ok of ["application/pdf", "image/png", "image/jpeg; charset=binary", "video/mp4", "AUDIO/MPEG"]) {
      expect(isInlineSafeContentType(ok), ok).toBe(true);
    }
    for (const bad of ["text/html", "image/svg+xml", "application/xhtml+xml", "text/xml", "application/javascript", "application/octet-stream", "", null, undefined]) {
      expect(isInlineSafeContentType(bad as string | null | undefined), String(bad)).toBe(false);
    }
  });
  it("builds a safe attachment header", () => {
    expect(attachmentDisposition('a"b\r\nSet-Cookie: x.html')).toBe('attachment; filename="a_b_Set-Cookie_x.html"');
    expect(attachmentDisposition("")).toBe('attachment; filename="download"');
  });
  it("the two inline-capable signers force a download for active types", () => {
    expect(read("src/app/api/courses/deliveries/[deliveryId]/contents/[contentId]/file/route.ts")).toContain("isInlineSafeContentType(");
    expect(read("src/modules/storage/private-object-storage.ts")).toContain("isInlineSafeContentType(attestation.contentType)");
    expect(read("src/modules/storage/file-lifecycle.ts")).toContain("inlineSafe");
  });
});

describe("7. no mutating route is unguarded", () => {
  const MUTATING = /export\s+(?:const|async function|function)\s+(?:POST|PUT|PATCH|DELETE)\b|export\s*\{[^}]*\b(?:POST|PUT|PATCH|DELETE)\b[^}]*\}/;
  const GUARDED = /\broute\(|\binternalRoute\(|\bsecured\(|\bwebhookRoute\(|\bsecureHandler\(|\bcreateSecureHandler|\bshim\w*\(/;
  it("every POST, PUT, PATCH and DELETE handler uses a guard wrapper or re-exports one that does", () => {
    const routes = walk(path.join(root, "src/app/api")).filter((f) => f.endsWith(`${path.sep}route.ts`));
    expect(routes.length).toBeGreaterThan(900);
    const unguarded: string[] = [];
    for (const file of routes) {
      const source = readFileSync(file, "utf8");
      if (!MUTATING.test(source) || GUARDED.test(source)) continue;
      const pureReexport = /export\s*\{[^}]*\}\s*from/.test(source) && !/export\s+(?:async\s+)?function\s+(?:POST|PUT|PATCH|DELETE)/.test(source);
      if (!pureReexport) unguarded.push(path.relative(root, file).split(path.sep).join("/"));
    }
    expect(unguarded).toEqual([]);
  }, 60_000);
});

describe("8. nothing sensitive leaves in a response or a log line", () => {
  it("no API route sends a stack trace to the client", () => {
    const offenders = walk(path.join(root, "src/app/api"))
      .filter((f) => f.endsWith(".ts"))
      .filter((f) => /\.stack\b/.test(readFileSync(f, "utf8")))
      .map((f) => path.relative(root, f));
    expect(offenders).toEqual([]);
  }, 60_000);

  it("scrubs values a database or HTTP error can echo", () => {
    expect(redactString("duplicate key value violates unique constraint. Key (phone_e164)=(+919876543210) already exists."))
      .toBe("duplicate key value violates unique constraint. Key (phone_e164)=([redacted]) already exists.");
    expect(redactString("connect failed postgresql://app:hunter2@10.1.2.3:5432/lms"))
      .toBe("connect failed postgresql://[redacted]");
    expect(redactString("Authorization: Bearer abcdef0123456789abcdef")).toBe("Authorization: Bearer [redacted]");
    expect(redactString("jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NSJ9.c2lnbmF0dXJl end")).toBe("jwt [redacted-jwt] end");
    expect(redactString("GET https://x.r2.dev/k?X-Amz-Signature=deadbeef&X-Amz-Credential=AKIA%2Fx"))
      .toBe("GET https://x.r2.dev/k?X-Amz-Signature=[redacted]&X-Amz-Credential=[redacted]");
    expect(redactString("mail to asha.rao@example.com or +919876543210")).toBe("mail to [email] or [phone]");
    expect(redactString("retry ?otp=135790&x=1")).toBe("retry ?otp=[redacted]&x=1");
  });

  it("drops sensitive keys and keeps ordinary operational fields", () => {
    const out = redactLogFields({
      route: "/api/x",
      status: 500,
      password: "p",
      sessionToken: "t",
      nested: { apiKey: "k", ok: "fine", Cookie: "c" },
      list: [{ otp: "1" }],
    });
    expect(out).toEqual({
      route: "/api/x",
      status: 500,
      password: "[redacted]",
      sessionToken: "[redacted]",
      nested: { apiKey: "[redacted]", ok: "fine", Cookie: "[redacted]" },
      list: [{ otp: "[redacted]" }],
    });
  });

  it("every severity is redacted when a log record is built, and the request reference survives", () => {
    for (const severity of ["ERROR", "WARNING", "INFO", "DEBUG"] as const) {
      const record = createStructuredLogRecord(severity, "x.y", {
        requestId: "abcd1234",
        message: "Key (email)=(a@b.co) already exists",
        token: "t",
      });
      expect(record.requestId).toBe("abcd1234");
      expect(JSON.stringify(record)).not.toContain("a@b.co");
      expect(record["token"]).toBe("[redacted]");
    }
  });
});
