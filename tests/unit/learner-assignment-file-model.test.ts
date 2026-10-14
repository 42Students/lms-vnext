import { describe, expect, it, vi } from "vitest";
import { learnerAssignmentFileRequest, learnerAssignmentFilePayload, learnerAssignmentUploadGrantSchema } from "@/modules/courses/learner-assignment-file-model";
import { transferLearnerAssignmentFile } from "@/components/courses/assignment-file-transfer";
const delivery = "00000000-0000-4000-8000-000000000001";
const receipt = "00000000-0000-4000-8000-000000000002";
const grant = { receiptId: receipt, method: "PUT", uploadUrl: "https://storage.example.test/signed?token=private",
  expiresAt: "2099-01-01T00:00:00Z", requiredHeaders: { "content-type": "application/pdf", "x-amz-meta-upload-token": "test-token" }, originalName: "proof.pdf" };
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
    expect(learnerAssignmentUploadGrantSchema.safeParse({ grant: { ...grant, uploadUrl: "http://storage.example.test" } }).success).toBe(false);
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
