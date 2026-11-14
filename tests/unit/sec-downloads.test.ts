import { describe, expect, it } from "vitest";
import { attachmentHeader, safeDownloadFilename } from "@/security/downloads";

describe("download filenames", () => {
  it("passes a plain name through unchanged", () => {
    expect(attachmentHeader("applications.csv")).toBe('attachment; filename="applications.csv"');
  });
  it("cannot break out of the header or the path", () => {
    expect(safeDownloadFilename('a"; x=1\r\nSet-Cookie: y=1')).not.toMatch(/["\r\n;]/);
    expect(safeDownloadFilename("../../etc/passwd")).not.toContain("/");
    expect(safeDownloadFilename("..hidden")).toBe("hidden");
    expect(safeDownloadFilename("")).toBe("download");
    expect(safeDownloadFilename("\u0000\u001f")).toBe("download");
  });
  it("keeps non-ASCII names through filename* with an ASCII fallback", () => {
    const header = attachmentHeader("परिणाम.csv");
    expect(header).toContain('filename="');
    expect(header).toContain("filename*=UTF-8''" + encodeURIComponent("परिणाम.csv"));
    expect(header.split("; filename*")[0]).toMatch(/^[\x20-\x7e]+$/);
  });
  it("caps very long names", () => {
    expect(safeDownloadFilename("x".repeat(500)).length).toBe(120);
  });
});
