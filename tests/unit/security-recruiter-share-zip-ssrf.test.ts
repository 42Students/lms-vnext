import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { presignUrl } from "@/modules/storage/s3-client";
import { isAllowedCompanyShareResumeDownload } from "@/modules/placements/company-share/signed-resume-guard";

const values = {
  college: "11111111-1111-4111-8111-111111111111",
  owner: "22222222-2222-4222-8222-222222222222",
  object: "33333333-3333-4333-8333-333333333333",
};

const config = {
  endpoint: "https://acct.r2.cloudflarestorage.com",
  bucket: "private-documents",
  keyPrefix: "vnext-dev/",
  accessKeyId: "TEST_PRIVATE_ACCESS_KEY",
  secretAccessKey: "unit-test-key-is-not-a-real-provider-secret",
};
const objectKey = "private/" + values.college + "/" + values.owner +
  "/placement-document/" + values.object;
const signed = (now = new Date(), key = objectKey) =>
  presignUrl(config, {
    method: "GET", key, now, expiresSeconds: 60,
    query: { "response-cache-control": "private, no-store, max-age=0" },
  });

const mocks = vi.hoisted(() => ({
  share: vi.fn(), getPrivateR2Config: vi.fn(), cookies: vi.fn(),
}));
vi.mock("@/modules/placements/company-share/public-service", () => ({
  getPublicCompanyApplicantShare: mocks.share,
}));
vi.mock("@/modules/storage/r2-config", () => ({
  getPrivateR2Config: mocks.getPrivateR2Config,
}));
vi.mock("next/headers", () => ({ cookies: mocks.cookies }));

import { GET } from "@/app/api/placements/company-share/[token]/export/route";

const route = () => GET(
  new Request("https://lms.example.test/api/placements/company-share/token/export?format=zip"),
  { params: Promise.resolve({ token: "opaque-public-share" }) },
);
const ready = (links: readonly string[], resumeColumn = true) => ({
  kind: "READY", selectedColumns: resumeColumn ? ["APPLICATION_ID", "RESUME"] : ["APPLICATION_ID"],
  rows: links.map((link, index) => ({
    applicationId: values.object.slice(0, 27) + String(index).padStart(9, "0"),
    cells: { RESUME: link },
  })),
  truncated: false,
});

describe("SEC-API7 recruiter public share: private R2 destination allowlist", () => {
  const issuedAt = new Date("2026-11-04T10:00:00.000Z");
  it("accepts only a current, correctly signed path-style private placement-document URL", () => {
    expect(isAllowedCompanyShareResumeDownload(signed(issuedAt), config,
      new Date("2026-11-04T10:00:30.000Z"))).toBe(true);
    expect(isAllowedCompanyShareResumeDownload(signed(issuedAt), config,
      new Date("2026-11-04T10:01:01.000Z"))).toBe(false);
    expect(isAllowedCompanyShareResumeDownload(signed(issuedAt), config,
      new Date("2026-11-04T09:59:40.000Z"))).toBe(false);
  });

  it("denies SSRF destinations, private IPs, a different bucket and wrong namespaces", () => {
    const original = signed(issuedAt);
    const wrongHost = original.replace("acct.r2.cloudflarestorage.com", "evil.invalid");
    const malicious = [
      "https://127.0.0.1/internal", "https://169.254.169.254/latest/meta-data",
      "https://localhost:8443/admin", "http://acct.r2.cloudflarestorage.com/private",
      wrongHost, original.replace("https://", "https://user:password@"),
      original.replace("private-documents/", "public-files/"),
      signed(issuedAt, "private/" + values.college + "/" + values.owner +
        "/profile-verification/" + values.object),
      signed(issuedAt, "private/" + values.college + "/" + values.owner +
        "/placement-document/" + values.object + "/extra"),
      original + "#fragment",
      original.replace("vnext-dev/", "vnext-dev/../"),
    ];
    for (const candidate of malicious) {
      expect(isAllowedCompanyShareResumeDownload(candidate, config,
        new Date("2026-11-04T10:00:30.000Z")), candidate).toBe(false);
    }
  });

  it("rejects missing, duplicated and inconsistent SigV4 query credentials", () => {
    const original = signed(issuedAt);
    const url = new URL(original);
    const candidates = [
      original + "&X-Amz-Expires=60",
      original + "&X-Amz-Signature=" + "a".repeat(64),
      original.replace("X-Amz-Expires=60", "X-Amz-Expires=99"),
      original.replace("AWS4-HMAC-SHA256", "invalid-algorithm"),
      original.replace("TEST_PRIVATE_ACCESS_KEY", "UNAUTHORIZED_KEY"),
      original.replace("response-cache-control=private%2C%20no-store%2C%20max-age%3D0",
        "response-cache-control=public"),
    ];
    url.searchParams.delete("X-Amz-Signature");
    candidates.push(url.toString());
    for (const candidate of candidates) {
      expect(isAllowedCompanyShareResumeDownload(candidate, config,
        new Date("2026-11-04T10:00:30.000Z")), candidate).toBe(false);
    }
  });

  it("private R2 development prefixes are exact, not a loose origin-only match", () => {
    const current = signed(issuedAt);
    expect(isAllowedCompanyShareResumeDownload(current, { ...config, keyPrefix: "another/" },
      new Date("2026-11-04T10:00:30.000Z"))).toBe(false);
  });
});

describe("SEC-API7 public recruiter ZIP: no arbitrary external fetch", () => {
  beforeEach(() => {
    mocks.share.mockReset();
    mocks.cookies.mockReset().mockResolvedValue({
      get: () => ({ value: "sealed-cookie-proof" }),
    });
    mocks.getPrivateR2Config.mockReset().mockReturnValue(config);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("denies arbitrary HTTPS and metadata-server origins without issuing any fetch", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    mocks.share.mockResolvedValue(ready([
      "https://evil.invalid/private-document",
      "https://127.0.0.1/admin",
    ]));
    const response = await route();
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "NO_READABLE_RESUMES" });
    expect(fetcher).not.toHaveBeenCalled();
    expect(mocks.share).toHaveBeenCalledWith(
      "opaque-public-share", 1, "CSV", "", "sealed-cookie-proof",
    );
  });

  it("requires a selected resume column even with a valid signed URL", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    mocks.share.mockResolvedValue(ready([signed()], false));
    const response = await route();
    expect(response.status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fails closed when the configured private storage destination is unavailable", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    mocks.getPrivateR2Config.mockImplementation(() => { throw new Error("STORAGE_UNAVAILABLE"); });
    mocks.share.mockResolvedValue(ready([signed()]));
    const response = await route();
    expect(response.status).toBe(409);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("downloads only a verified signed R2 URL without redirects or cache", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(
      new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
      { headers: { "content-type": "application/pdf", "content-length": "5" } },
    ));
    vi.stubGlobal("fetch", fetcher);
    const url = signed();
    mocks.share.mockResolvedValue(ready([url]));
    const response = await route();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("Content-Type")).toBe("application/zip");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0]?.[0]).toBe(url);
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({ redirect: "error", cache: "no-store" });
    // outboundFetch carries the headers as a Headers object.
    expect(new Headers(fetcher.mock.calls[0]?.[1]?.headers).get("accept")).toBe("application/octet-stream");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(bytes.byteLength).toBeGreaterThan(5);
  });

  it("caps the aggregate content of a public resume ZIP at 48 MiB", async () => {
    const twelveMiB = new Uint8Array(12 * 1024 * 1024);
    twelveMiB.fill(0x41);
    const fetcher = vi.fn().mockImplementation(async () => new Response(twelveMiB, {
      headers: { "content-type": "application/pdf",
        "content-length": String(twelveMiB.byteLength) },
    }));
    vi.stubGlobal("fetch", fetcher);
    mocks.share.mockResolvedValue(ready(Array.from({ length: 5 }, () => signed())));
    const response = await route();
    expect(response.status).toBe(200);
    // Four 12-MiB documents reach the cap; the fifth never triggers fetch.
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    const zip = new Uint8Array(await response.arrayBuffer());
    expect(zip.byteLength).toBeGreaterThan(48 * 1024 * 1024);
    expect(zip.byteLength).toBeLessThan(49 * 1024 * 1024);
  });

  it("rejects an oversized declared response before reading its body", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(
      new Uint8Array([1]),
      { headers: { "content-type": "application/pdf",
        "content-length": String(12 * 1024 * 1024 + 1) } },
    ));
    vi.stubGlobal("fetch", fetcher);
    mocks.share.mockResolvedValue(ready([signed()]));
    const response = await route();
    expect(response.status).toBe(409);
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
