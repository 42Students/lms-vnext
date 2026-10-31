import { describe, expect, it } from "vitest";
import {
  assignmentFileAttestationUsable,
  NON_PRODUCTION_FILE_ATTESTATION,
  PRIVILEGED_FILE_SCANNER,
  type AssignmentFileAttestation,
} from "@/modules/storage/file-attestation-policy";

const now = new Date("2026-10-31T12:00:00.000Z");
const clean: AssignmentFileAttestation = {
  status: "READY",
  scanStatus: "CLEAN",
  scanAttestedBy: PRIVILEGED_FILE_SCANNER,
  scanAttestedAt: new Date("2026-10-31T11:59:00.000Z"),
  completedAt: new Date("2026-10-31T11:59:00.000Z"),
  objectGeneration: "1720000000000",
  verifiedContentType: "application/pdf",
  verifiedSizeBytes: 128,
  sha256Hex: "a".repeat(64),
  declaredContentType: "application/pdf",
  declaredSizeBytes: 128,
};
const usable = (file: Partial<AssignmentFileAttestation> = {}, APP_ENV?: string) =>
  assignmentFileAttestationUsable({ ...clean, ...file }, { APP_ENV }, now);

describe("DB018 registered FILE scan attestation before submit and private read", () => {
  it("accepts the exact CLEAN privileged scanner with full matching object identity", () => {
    expect(usable()).toBe(true);
    expect(usable({}, "production")).toBe(true);
  });
  it("accepts development attestation only when APP_ENV explicitly opts into non-production", () => {
    const file = { scanAttestedBy: NON_PRODUCTION_FILE_ATTESTATION };
    expect(usable(file, "test")).toBe(true);
    expect(usable(file, "development")).toBe(true);
    expect(usable(file, undefined)).toBe(false);
    expect(usable(file, "production")).toBe(false);
    expect(usable(file, "preview")).toBe(false);
  });
  it("rejects arbitrary scanner identity, pending scan and incorrect READY state", () => {
    expect(usable({ scanAttestedBy: "user-passed" })).toBe(false);
    expect(usable({ scanAttestedBy: null })).toBe(false);
    expect(usable({ scanStatus: "PENDING" })).toBe(false);
    expect(usable({ status: "VERIFYING" })).toBe(false);
    expect(usable({ status: "DELETED" })).toBe(false);
  });
  it("rejects missing or forged immutable object generation and digest", () => {
    expect(usable({ objectGeneration: null })).toBe(false);
    expect(usable({ objectGeneration: "abc" })).toBe(false);
    expect(usable({ sha256Hex: null })).toBe(false);
    expect(usable({ sha256Hex: "a".repeat(63) })).toBe(false);
    expect(usable({ sha256Hex: "G".repeat(64) })).toBe(false);
  });
  it("rejects mismatched content identity and bytes", () => {
    expect(usable({ verifiedContentType: null })).toBe(false);
    expect(usable({ verifiedContentType: "image/jpeg" })).toBe(false);
    expect(usable({ verifiedSizeBytes: null })).toBe(false);
    expect(usable({ verifiedSizeBytes: 127 })).toBe(false);
    expect(usable({ declaredSizeBytes: 0, verifiedSizeBytes: 0 })).toBe(false);
  });
  it("rejects forged scan and completion chronology", () => {
    expect(usable({ scanAttestedAt: null })).toBe(false);
    expect(usable({ completedAt: null })).toBe(false);
    expect(usable({ scanAttestedAt: new Date("2026-10-31T12:05:00.000Z") })).toBe(false);
    expect(usable({ completedAt: new Date("2026-10-31T11:58:00.000Z") })).toBe(false);
    expect(usable({ scanAttestedAt: new Date(Number.NaN) })).toBe(false);
  });
});
