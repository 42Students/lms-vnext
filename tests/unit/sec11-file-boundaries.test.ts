import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/security/audit-store", () => ({ recordSecurityEvent: vi.fn() }));

import { magicBytesMatch, validateStorageDeclaration } from "@/modules/storage/file-policy";
import { issueObjectReadUrl } from "@/modules/storage/file-lifecycle";

const college = "20000000-0000-4000-8000-000000000001";
const owner = "40000000-0000-4000-8000-000000000001";
const readable = (objectKey: string) => ({ objectKey, collegeId: college, ownerMembershipId: owner, generation: "1", sizeBytes: 10, contentType: "application/pdf" });
const opts = { ttlSeconds: 300, maxTtlSeconds: 300 };

describe("SEC-11 file boundaries: dangerous types, traversal, signed-link scope", () => {
  it("refuses active or executable content types for every upload kind (SEC-11-009, SEC-11-017)", () => {
    for (const kind of ["assignment-submission", "project-resource", "lesson-video"] as const) {
      for (const [name, type] of [["a.html", "text/html"], ["a.svg", "image/svg+xml"], ["a.exe", "application/x-msdownload"], ["a.js", "text/javascript"], ["a.php", "application/x-httpd-php"]] as const) {
        const r = validateStorageDeclaration(kind, { originalName: name, contentType: type, sizeBytes: 100 });
        expect(r.ok, `${kind} ${type}`).toBe(false);
      }
    }
  });

  it("refuses an extension that does not match the declared type (SEC-11-009)", () => {
    const r = validateStorageDeclaration("assignment-submission", { originalName: "report.html", contentType: "application/pdf", sizeBytes: 100 });
    expect(r).toMatchObject({ ok: false, code: "STORAGE_EXTENSION_MISMATCH" });
  });

  it("refuses names with path parts or control characters (SEC-11-012, SEC-11-013)", () => {
    for (const name of ["../x.pdf", "a/b.pdf", "a\\b.pdf", "x\u0000.pdf", "..", "."]) {
      const r = validateStorageDeclaration("assignment-submission", { originalName: name, contentType: "application/pdf", sizeBytes: 100 });
      expect(r, JSON.stringify(name)).toMatchObject({ ok: false, code: "STORAGE_NAME_INVALID" });
    }
  });

  it("checks the first bytes, so an HTML page declared as a PDF is rejected (SEC-11-007)", () => {
    expect(magicBytesMatch("application/pdf", new TextEncoder().encode("<html><script>alert(1)</script></html>"))).toBe(false);
    expect(magicBytesMatch("application/pdf", new TextEncoder().encode("%PDF-1.7\n"))).toBe(true);
    expect(magicBytesMatch("image/png", new TextEncoder().encode("<svg onload=alert(1)>"))).toBe(false);
  });

  it("never signs a link for a key outside the college and owner prefix, or one containing '..' (SEC-11-005, 006, 013)", async () => {
    const own = `private/${college}/${owner}/assignment-submission/70000000-0000-4000-8000-000000000001`;
    const other = `private/30000000-0000-4000-8000-000000000009/${owner}/assignment-submission/x`;
    const traversal = `private/${college}/${owner}/../${owner}/assignment-submission/x`;
    await expect(issueObjectReadUrl(readable(other), opts)).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    await expect(issueObjectReadUrl(readable(traversal), opts)).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    await expect(issueObjectReadUrl(readable("public/anything"), opts)).rejects.toMatchObject({ code: "STORAGE_NOT_FOUND" });
    // an own-prefix key proceeds to configuration (not configured in unit tests), which is a different, later failure
    await expect(issueObjectReadUrl(readable(own), opts)).rejects.not.toMatchObject({ code: "STORAGE_NOT_FOUND" });
  });
});
