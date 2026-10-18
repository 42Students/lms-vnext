import { describe, expect, it, vi } from "vitest";
import { learnerAssignmentFileRequest, learnerAssignmentFilePayload, learnerAssignmentUploadGrantSchema, validateLearnerAssignmentReadGrant, validateLearnerAssignmentUploadGrant, learnerAssignmentUploadHeadersSafe } from "@/modules/courses/learner-assignment-file-model";
import { transferLearnerAssignmentFile } from "@/components/courses/assignment-file-transfer";
const delivery = "00000000-0000-4000-8000-000000000001";
const receipt = "00000000-0000-4000-8000-000000000002";
const grant = { receiptId: receipt, method: "PUT", uploadUrl: "https://storage.example.test/signed?token=private",
  expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(), requiredHeaders: { "content-type": "application/pdf", "x-amz-meta-upload-token": "test-token", "x-amz-meta-owner-membership-id": delivery, "x-amz-meta-college-id": receipt, "x-amz-meta-expected-size": "5", "x-amz-meta-malware-scan-status": "PENDING" }, originalName: "proof.pdf" };
describe("learner assignment private-file boundary", () => {
  it("validates file size, filename and allowed MIME without trusting extension over provided MIME", () => {
    expect(learnerAssignmentFileRequest(delivery, { name: "paper.docx", size: 10, type: "" }).success).toBe(true);
    expect(learnerAssignmentFileRequest(delivery, { name: "photo.jpeg", size: 10, type: "image/jpeg" }).success).toBe(true);
    for (const file of [
      { name: "../proof.pdf", size: 10, type: "application/pdf" },
      { name: "proof.pdf", size: 0, type: "application/pdf" },
      { name: "proof.pdf", size: 52_428_801, type: "application/pdf" },
      { name: "proof.pdf", size: 10, type: "text/html" },
      { name: "installer.exe", size: 10, type: "application/pdf" },
      { name: "document.pdf", size: 10, type: "application/msword" },
      { name: "photo.png", size: 10, type: "image/jpeg" },
    ]) expect(learnerAssignmentFileRequest(delivery, file).success).toBe(false);
  });
  it("requires an exact own-delivery receipt and explicit final confirmation", () => {
    expect(learnerAssignmentFilePayload(delivery, receipt, true)).toMatchObject({ submissionType: "FILE", uploadReceiptId: receipt });
    expect(() => learnerAssignmentFilePayload(delivery, receipt, false)).toThrow();
    expect(() => learnerAssignmentFilePayload(delivery, "forged", true)).toThrow();
    for (const url of ["http://storage.example.test", "https://user:secret@storage.example.test/file", "https://storage.example.test/file#fragment"]) {
      expect(learnerAssignmentUploadGrantSchema.safeParse({ grant: { ...grant, uploadUrl: url } }).success).toBe(false);
    }
  });
  it("rejects unsafe signed PUT headers", () => {
    expect(learnerAssignmentUploadHeadersSafe(grant.requiredHeaders)).toBe(true);
    expect(learnerAssignmentUploadHeadersSafe({})).toBe(false);
    expect(learnerAssignmentUploadHeadersSafe({ "content-type": "application/pdf" })).toBe(false);
    expect(learnerAssignmentUploadHeadersSafe({ ...grant.requiredHeaders, "x-amz-meta-malware-scan-status": "CLEAN" })).toBe(false);
    // LEARNER-FILE-GRANT-05: no attacker-controlled additional object metadata.
    expect(learnerAssignmentUploadHeadersSafe({ ...grant.requiredHeaders, "x-amz-meta-debug": "customer-secret" })).toBe(false);
    expect(learnerAssignmentUploadHeadersSafe({ ...grant.requiredHeaders, "x-amz-meta-malware-scan-status": "PENDING", "x-amz-meta-owner-scope": "other-college" })).toBe(false);
    expect(learnerAssignmentUploadHeadersSafe({ ...grant.requiredHeaders, "x-amz-meta-expected-size": "0" })).toBe(false);
    expect(learnerAssignmentUploadHeadersSafe({ ...grant.requiredHeaders, "x-amz-meta-expected-size": "52428801" })).toBe(false);
    const badHeaders: Record<string, string>[] = [{ authorization: "Bearer secret" }, { "content-type": "application/pdf\r\nX-Test: 1" }, { cookie: "session=secret" }];
    for (const bad of badHeaders) {
      expect(learnerAssignmentUploadHeadersSafe(bad)).toBe(false);
    }
  });
  it("bounds upload-grant validity to fifteen minutes", () => {
    const now = Date.parse("2026-10-14T10:00:00Z");
    expect(validateLearnerAssignmentUploadGrant({ grant: { ...grant, expiresAt: "2026-10-14T10:10:00Z" } }, now).receiptId).toBe(receipt);
    for (const expiresAt of ["2026-10-14T10:00:00Z", "2026-10-14T11:00:00Z"]) {
      expect(() => validateLearnerAssignmentUploadGrant({ grant: { ...grant, expiresAt } }, now)).toThrow();
    }
  });
  it("uploads only to the signed URL without app cookies and never auto-submits", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ grant }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    const file = new File(["proof"], "proof.pdf", { type: "application/pdf" });
    const uploaded = await transferLearnerAssignmentFile("assignment", delivery, file, new AbortController().signal, fetcher);
    expect(uploaded).toEqual({ receiptId: receipt, originalName: "proof.pdf", expiresAt: grant.expiresAt });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[0]?.[0]).toBe("/api/courses/assignments/assignment/file-upload");
    expect(fetcher.mock.calls[1]).toEqual([grant.uploadUrl, expect.objectContaining({ method: "PUT", credentials: "omit", redirect: "error", body: file, headers: grant.requiredHeaders })]);
  });
  it("rejects a receipt when the upload grant expires during transfer", async () => {
    const file = new File(["proof"], "proof.pdf", { type: "application/pdf" });
    const start = Date.parse("2026-10-15T10:00:00Z");
    const expiresAt = new Date(start + 100).toISOString();
    const clock = vi.fn().mockReturnValueOnce(start).mockReturnValueOnce(start).mockReturnValueOnce(start + 150);
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ grant: { ...grant, expiresAt } }))
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    await expect(transferLearnerAssignmentFile("assignment", delivery, file,
      new AbortController().signal, fetcher, clock)).rejects.toThrow("expired before confirmation");
    expect(clock).toHaveBeenCalledTimes(3);
  });
  it("does not PUT bytes after a rejected, mismatched or expired grant", async () => {
    const file = new File(["proof"], "proof.pdf", { type: "application/pdf" });
    for (const bad of [
      { ...grant, originalName: "different.pdf" },
      { ...grant, expiresAt: "2000-01-01T00:00:00Z" },
      { ...grant, requiredHeaders: { "content-type": "text/html" } },
      { ...grant, requiredHeaders: { ...grant.requiredHeaders, "x-amz-meta-expected-size": "999" } },
      { ...grant, requiredHeaders: Object.fromEntries(Object.entries(grant.requiredHeaders).filter(([key]) => key !== "x-amz-meta-expected-size")) },
    ]) {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ grant: bad }));
      await expect(transferLearnerAssignmentFile("assignment", delivery, file, new AbortController().signal, fetcher)).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
  });
  it("fails closed when object storage responds with a redirect", async () => {
    const file = new File(["proof"], "proof.pdf", { type: "application/pdf" });
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(Response.json({ grant }))
      .mockRejectedValueOnce(new TypeError("redirect blocked"));
    await expect(transferLearnerAssignmentFile("assignment", delivery, file,
      new AbortController().signal, fetcher)).rejects.toThrow("redirect blocked");
    expect(fetcher.mock.calls[1]?.[1]).toEqual(expect.objectContaining({
      credentials: "omit", redirect: "error", method: "PUT",
    }));
  });
  it("does not report a ready receipt when signed PUT fails", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ grant }))
      .mockResolvedValueOnce(new Response(null, { status: 403 }));
    await expect(transferLearnerAssignmentFile("assignment", delivery,
      new File(["proof"], "proof.pdf", { type: "application/pdf" }), new AbortController().signal, fetcher)).rejects.toThrow("has not been submitted");
  });
});

describe("transient assignment file read grants", () => {
  const now = Date.parse("2026-10-14T10:00:00Z");
  const read = { readUrl: "https://storage.example.test/private?signature=secret", expiresAt: "2026-10-14T10:05:00Z",
    originalName: "proof.pdf", mimeType: "application/pdf", sizeBytes: 100 };
  it("accepts only a validated short-lived HTTPS file grant", () => {
    expect(validateLearnerAssignmentReadGrant({ grant: read }, now)).toEqual(read);
  });
  it("rejects expired, public-protocol, credential-bearing and overlong grants", () => {
    for (const patch of [
      { expiresAt: "2026-10-14T09:59:59Z" }, { expiresAt: "2026-10-14T11:00:00Z" },
      { readUrl: "http://storage.example.test/file" }, { readUrl: "javascript:alert(1)" },
      { readUrl: "https://user:password@storage.example.test/file" },
      { readUrl: "https://storage.example.test/file#fragment" }, { sizeBytes: 0 },
    ]) expect(() => validateLearnerAssignmentReadGrant({ grant: { ...read, ...patch } }, now)).toThrow();
  });
});
