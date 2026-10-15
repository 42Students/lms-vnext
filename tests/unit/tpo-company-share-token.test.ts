import { describe, expect, it } from "vitest";
import {
  companyShareTokenSchema, companyShareIssueSchema, issueCompanyShareToken,
  isCompanyShareLive, companyShareExpiry, hashCompanyShareToken,
} from "@/modules/placements/company-share/token-model";

describe("TPO company share capability", () => {
  it("issues high entropy, nonreusable secrets and stores only digests", () => {
    const a = issueCompanyShareToken(), b = issueCompanyShareToken();
    expect(a.token).not.toBe(b.token);
    expect(companyShareTokenSchema.safeParse(a.token).success).toBe(true);
    expect(a.digest).toBe(hashCompanyShareToken(a.token));
    expect(a.digest).toMatch(/^[a-f0-9]{64}$/);
    expect(a.digest).not.toContain(a.token);
  });
  it("bounds share validity and denies expiry/revocation exactly", () => {
    const now = new Date("2026-10-15T14:00:00Z");
    const expiresAt = companyShareExpiry(now, 2);
    expect(isCompanyShareLive({expiresAt, revokedAt:null}, now)).toBe(true);
    expect(isCompanyShareLive({expiresAt, revokedAt:null}, expiresAt)).toBe(false);
    expect(isCompanyShareLive({expiresAt, revokedAt:now}, now)).toBe(false);
    expect(companyShareIssueSchema.safeParse({jobId:"bad",expiresInDays:8}).success).toBe(false);
  });
});
