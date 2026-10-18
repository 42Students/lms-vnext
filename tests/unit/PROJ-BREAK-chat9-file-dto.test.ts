import { describe, expect, it, vi } from "vitest";
import { toProjectFileDto } from "@/modules/projects/project-resource-file-service";

vi.mock("server-only", () => ({}));

const projectId = "11111111-1111-4111-8111-111111111111";
const fileId = "22222222-2222-4222-8222-222222222222";
const createdAt = new Date("2026-10-18T07:00:00.000Z");
const completedAt = new Date("2026-10-18T07:05:00.000Z");

const row = (patch: Record<string, unknown> = {}) => ({
  id: fileId,
  projectId,
  collegeId: "33333333-3333-4333-8333-333333333333",
  resourceId: null,
  title: "Report",
  description: "Final PDF",
  originalName: "report.pdf",
  declaredContentType: "application/octet-stream",
  verifiedContentType: "application/pdf",
  declaredSizeBytes: 100,
  verifiedSizeBytes: 97,
  status: "READY",
  failureCode: null,
  createdAt,
  completedAt,
  objectKey: "private/tenant/opaque-storage-key",
  uploadTokenHash: "never-leak-upload-token-hash",
  uploadExpiresAt: new Date("2026-10-18T07:30:00.000Z"),
  uploaderMembershipId: "44444444-4444-4444-8444-444444444444",
  createdByUserId: "55555555-5555-4555-8555-555555555555",
  ...patch,
}) as unknown as Parameters<typeof toProjectFileDto>[0];

describe("IIT Dharwad Projects file DTO redaction and verified metadata", () => {
  it("PROJ-BREAK-files-20 returns only authorized public fields with no signed URLs, storage secrets or membership", () => {
    const dto = toProjectFileDto(row());
    expect(Object.keys(dto).sort()).toEqual([
      "completedAt", "contentType", "createdAt", "description",
      "failureCode", "id", "originalName", "projectId", "resourceId",
      "sizeBytes", "status", "title",
    ]);
    expect(JSON.stringify(dto)).not.toContain("opaque-storage-key");
    expect(JSON.stringify(dto)).not.toContain("upload-token-hash");
    expect(JSON.stringify(dto)).not.toContain("44444444-4444");
  });

  it("PROJ-BREAK-files-21 verified content type and byte count override untrusted client declarations", () => {
    const dto = toProjectFileDto(row());
    expect(dto.contentType).toBe("application/pdf");
    expect(dto.sizeBytes).toBe(97);
    expect(toProjectFileDto(row({
      verifiedContentType: null, verifiedSizeBytes: null,
    }))).toMatchObject({
      contentType: "application/octet-stream", sizeBytes: 100,
    });
  });

  it("PROJ-BREAK-files-22 incomplete and failed transfers do not invent a completed timestamp", () => {
    const pending = toProjectFileDto(row({
      status: "UPLOADING", completedAt: null, failureCode: null,
    }));
    expect(pending.completedAt).toBeNull();
    expect(pending.status).toBe("UPLOADING");
    const failed = toProjectFileDto(row({
      status: "QUARANTINED", completedAt: null, failureCode: "FILE_REJECTED",
    }));
    expect(failed.completedAt).toBeNull();
    expect(failed.failureCode).toBe("FILE_REJECTED");
    expect(failed.createdAt).toBe(createdAt.toISOString());
    expect(toProjectFileDto(row()).completedAt).toBe(completedAt.toISOString());
  });
});
