import { describe, expect, it } from "vitest";
import { assertSafeOutboundUrl, OutboundUrlRefusedError } from "@/lib/outbound-url-guard";

const refused = (u: string) => {
  try {
    assertSafeOutboundUrl(u);
    return false;
  } catch (e) {
    return e instanceof OutboundUrlRefusedError;
  }
};

describe("SEC-15-010/011, SEC-23-012 outbound URL guard", () => {
  it("accepts public HTTPS provider URLs", () => {
    for (const u of ["https://api.zeptomail.in/v1.1/email", "https://abc123.r2.cloudflarestorage.com/bucket/key", "https://api.telegram.org/bot/x", "https://203.0.113.9/path"]) {
      expect(refused(u), u).toBe(false);
    }
  });

  it("refuses plain HTTP, credentials in the URL, and non-URLs", () => {
    for (const u of ["http://api.example.com/x", "https://user:pw@api.example.com/", "ftp://example.com/", "not a url", "//example.com/x", ""]) {
      expect(refused(u), u).toBe(true);
    }
  });

  it("refuses loopback, private, link-local and metadata addresses in every common spelling", () => {
    for (const u of [
      "https://127.0.0.1/", "https://127.1.2.3/", "https://0.0.0.0/", "https://10.0.0.5/", "https://172.16.5.5/", "https://172.31.255.1/",
      "https://192.168.1.1/", "https://169.254.169.254/computeMetadata/v1/", "https://100.64.0.1/", "https://[::1]/", "https://[::]/",
      "https://[fe80::1]/", "https://[fd12:3456::1]/", "https://[::ffff:10.0.0.1]/", "https://2130706433/", "https://0x7f000001/",
    ]) {
      expect(refused(u), u).toBe(true);
    }
  });

  it("refuses internal host names", () => {
    for (const u of ["https://localhost/", "https://app.localhost/", "https://metadata.google.internal/", "https://svc.cluster.local/", "https://lms-vnext-service/", "https://db.internal/"]) {
      expect(refused(u), u).toBe(true);
    }
  });

  it("does not refuse look-alike public ranges", () => {
    for (const u of ["https://172.15.0.1/", "https://172.32.0.1/", "https://11.0.0.1/", "https://100.63.0.1/"]) {
      expect(refused(u), u).toBe(false);
    }
  });
});
