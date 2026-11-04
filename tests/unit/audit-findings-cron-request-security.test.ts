import { describe, expect, it } from "vitest";
import { auditCronRequestRejection } from
  "@/modules/bug-tracker/audit-cron-request-guard";

const secret = "audit-cron-test-credential-" + "x".repeat(32);

function cronRequest({
  authorization = `Bearer ${secret}`,
  origin,
  search = "",
  contentLength,
  transferEncoding,
}: {
  authorization?: string;
  origin?: string;
  search?: string;
  contentLength?: string;
  transferEncoding?: string;
} = {}) {
  const headers = new Headers({ authorization });
  if (origin !== undefined) headers.set("origin", origin);
  if (contentLength !== undefined) headers.set("content-length", contentLength);
  if (transferEncoding !== undefined) headers.set("transfer-encoding", transferEncoding);
  return new Request(`https://lms.example.com/api/internal/audit-findings/sync${search}`, {
    method: "GET", headers,
  });
}

describe("private audit-findings Cloud Scheduler request boundary", () => {
  it("accepts only exact dedicated machine bearer credentials", () => {
    expect(auditCronRequestRejection(cronRequest(), secret)).toBeNull();
    expect(auditCronRequestRejection(cronRequest({ authorization: `Bearer ${secret}x` }), secret))
      .toBe("UNAUTHORIZED");
    expect(auditCronRequestRejection(cronRequest({ authorization: `Bearer ${secret.slice(0, -1)}` }), secret))
      .toBe("UNAUTHORIZED");
    expect(auditCronRequestRejection(cronRequest({ authorization: `Basic ${secret}` }), secret))
      .toBe("UNAUTHORIZED");
    expect(auditCronRequestRejection(cronRequest({ authorization: `bearer ${secret}` }), secret))
      .toBe("UNAUTHORIZED");
    expect(auditCronRequestRejection(cronRequest({ authorization: "" }), secret))
      .toBe("UNAUTHORIZED");
  });

  it("fails closed when the scheduler secret is missing, short or ambiguous", () => {
    for (const configured of [undefined, "", "short", "a".repeat(31),
      " " + secret, secret + " ", "a".repeat(257)]) {
      expect(auditCronRequestRejection(cronRequest(), configured)).toBe("UNAUTHORIZED");
    }
    const exact32 = "z".repeat(32);
    expect(auditCronRequestRejection(cronRequest({authorization: `Bearer ${exact32}`}),
      exact32)).toBeNull();
    const exact256 = "z".repeat(256);
    expect(auditCronRequestRejection(cronRequest({authorization: `Bearer ${exact256}`}),
      exact256)).toBeNull();
  });

  it("requires no browser Origin, even when it matches the Host", () => {
    for (const origin of ["https://lms.example.com", "https://attacker.example", ""]) {
      expect(auditCronRequestRejection(cronRequest({origin}), secret))
        .toBe("UNAUTHORIZED");
    }
  });

  it("refuses caller-controlled query selectors and request bodies", () => {
    expect(auditCronRequestRejection(cronRequest({search: "?collegeId=other"}), secret))
      .toBe("INVALID_REQUEST");
    expect(auditCronRequestRejection(cronRequest({contentLength: "5"}), secret))
      .toBe("INVALID_REQUEST");
    expect(auditCronRequestRejection(cronRequest({transferEncoding: "chunked"}), secret))
      .toBe("INVALID_REQUEST");
    expect(auditCronRequestRejection(cronRequest({contentLength: "0"}), secret))
      .toBeNull();
  });

  it("compares UTF-8 credential bytes rather than JS character length", () => {
    const internationalSecret = "é".repeat(18);
    expect(auditCronRequestRejection(cronRequest({
      authorization: `Bearer ${internationalSecret}`,
    }), internationalSecret)).toBeNull();
    expect(auditCronRequestRejection(cronRequest({
      authorization: `Bearer ${"é".repeat(17)}x`,
    }), internationalSecret)).toBe("UNAUTHORIZED");
  });
});
