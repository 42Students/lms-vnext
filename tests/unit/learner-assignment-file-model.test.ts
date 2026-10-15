import { describe, expect, it, vi } from "vitest";
import { learnerAssignmentFileRequest, learnerAssignmentFilePayload, learnerAssignmentUploadGrantSchema, validateLearnerAssignmentReadGrant, validateLearnerAssignmentUploadGrant, learnerAssignmentUploadHeadersSafe } from "@/modules/courses/learner-assignment-file-model";
import { transferLearnerAssignmentFile } from "@/components/courses/assignment-file-transfer";
const delivery = "00000000-0000-4000-8000-000000000001";
const receipt = "00000000-0000-4000-8000-000000000002";
const grant = { receiptId: receipt, method: "PUT", uploadUrl: "https://storage.example.test/signed?token=private",
  expiresAt: new Date(Date.now() + 10 * 60_000).toISOString(), requiredHeaders: { "content-type": "application/pdf", "x-amz-meta-upload-token": "test-token" }, originalName: "proof.pdf" };
describe("learner assignment private-file boundary", () => {
  it("validates file size, filename and allowed MIME without trusting extension over provided MIME", () => {
    expect(learnerAssignmentFileRequest(delivery, { name: "paper.docx", size: 10, type: "" }).success).toBe(true);
    for (const file of [
      { name: "../proof.pdf", size: 10, type: "application/pdf" },
      { name: "proof.pdf", size: 0, type: "application/pdf" },
      { name: "proof.pdf", size: 52_428_801, type: "application/pdf" },
      { name: "proof.pdf", size: 10, type: "text/html" },
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
    for (const bad of [{ authorization: "Bearer secret" }, { "content-type": "application/pdf\\r\\nX-Test: 1" }, { cookie: "session=secret" }]) {
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
    expect(fetcher.mock.calls[1]).toEqual([grant.uploadUrl, expect.objectContaining({ method: "PUT", credentials: "omit", body: file, headers: grant.requiredHeaders })]);
  });
  it("does not PUT bytes after a rejected, mismatched or expired grant", async () => {
    const file = new File(["proof"], "proof.pdf", { type: "application/pdf" });
    for (const bad of [
      { ...grant, originalName: "different.pdf" },
      { ...grant, expiresAt: "2000-01-01T00:00:00Z" },
      { ...grant, requiredHeaders: { "content-type": "text/html" } },
      { ...grant, requiredHeaders: { ...grant.requiredHeaders, "x-amz-meta-expected-size": "999" } },
    ]) {
      const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({ grant: bad }));
      await expect(transferLearnerAssignmentFile("assignment", delivery, file, new AbortController().signal, fetcher)).rejects.toThrow();
      expect(fetcher).toHaveBeenCalledTimes(1);
    }
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
      { readUrl: "https://user:password@storage.example.test/file" }, { sizeBytes: 0 },
    ]) expect(() => validateLearnerAssignmentReadGrant({ grant: { ...read, ...patch } }, now)).toThrow();
  });
});
