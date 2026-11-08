import { afterEach, describe, expect, it, vi } from "vitest";
import { companyShareAccessProof, validCompanyShareAccessProof } from "@/modules/placements/company-share/token-model";
import { SECRET_REGISTRY } from "@/security/secret-registry";

const AUTH = "a".repeat(40);
const SHARE = "b".repeat(40);
const args = ["share-1", "c".repeat(64), "d".repeat(64)] as const;

describe("SEC-15 company share proof uses its own secret", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is registered as an optional machine secret", () => {
    const entry = SECRET_REGISTRY.find((item) => item.name === "COMPANY_SHARE_PROOF_SECRET");
    expect(entry).toMatchObject({ kind: "secret", requiredInProduction: false });
  });

  it("signs with the dedicated secret when present, so a session-secret change does not affect it", () => {
    vi.stubEnv("AUTH_SECRET", AUTH);
    vi.stubEnv("COMPANY_SHARE_PROOF_SECRET", SHARE);
    const withDedicated = companyShareAccessProof(...args);
    vi.stubEnv("AUTH_SECRET", "z".repeat(40));
    expect(companyShareAccessProof(...args)).toBe(withDedicated);
  });

  it("differs from a proof signed with the session secret", () => {
    vi.stubEnv("AUTH_SECRET", AUTH);
    vi.stubEnv("COMPANY_SHARE_PROOF_SECRET", "");
    const fallback = companyShareAccessProof(...args);
    vi.stubEnv("COMPANY_SHARE_PROOF_SECRET", SHARE);
    expect(companyShareAccessProof(...args)).not.toBe(fallback);
  });

  it("falls back to the session secret when the dedicated one is unset, and refuses a short secret", () => {
    vi.stubEnv("AUTH_SECRET", AUTH);
    vi.stubEnv("COMPANY_SHARE_PROOF_SECRET", "");
    const proof = companyShareAccessProof(...args);
    expect(proof).toMatch(/^[a-f0-9]{64}$/);
    expect(validCompanyShareAccessProof(proof, proof)).toBe(true);
    vi.stubEnv("COMPANY_SHARE_PROOF_SECRET", "too-short");
    expect(companyShareAccessProof(...args)).toBeNull();
  });
});
