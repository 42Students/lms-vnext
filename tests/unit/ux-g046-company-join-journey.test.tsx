import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import CompanyJoinPage from "@/app/company-join/[token]/page";
import { getPublicJoinPreview } from "@/modules/placements/public-join/preview-service";
import { publicJoinUnavailable, publicJoinUnavailableCopy } from "@/modules/placements/public-join/readiness-state";

vi.mock("@/db/tenant-context", () => ({
  runAsSystem: async (_scope: string, work: () => Promise<unknown>) => work(),
}));
vi.mock("@/modules/placements/public-join/preview-service", () => ({
  getPublicJoinPreview: vi.fn(),
}));
vi.mock("@/modules/placements/public-join/readiness-state", () => ({
  publicJoinUnavailable: vi.fn(),
  publicJoinUnavailableCopy: vi.fn(),
}));
vi.mock("@/components/placements/public-join-preview-retry", () => ({
  PublicJoinPreviewRetry: ({ token, scope }: { token: string; scope: string }) =>
    createElement("p", { "data-preview-retry": scope, "data-token": token }, "Retry invitation preview"),
}));
vi.mock("@/components/placements/public-recruiter-join-form", () => ({
  PublicRecruiterJoinForm: ({ token, scope, preview, blockedReason }: {
    token: string; scope: string; preview: { kind: string }; blockedReason?: string | null;
  }) => createElement("section", {
    "data-join-scope": scope,
    "data-join-token": token,
    "data-preview-kind": preview.kind,
    "data-blocked": blockedReason ?? "",
  }, blockedReason ? "Verification is unavailable" : preview.kind === "READY" ? "Verify work email" : "Invitation is invalid"),
}));

const token = "A".repeat(36);
const visit = () => CompanyJoinPage({ params: Promise.resolve({ token }) });
const ready = { kind: "READY", collegeName: "Sample College", companyDomain: "example.org", companyName: "Sample Employer" } as const;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(publicJoinUnavailable).mockResolvedValue(null as never);
  vi.mocked(publicJoinUnavailableCopy).mockReturnValue("Verification is temporarily unavailable.");
});

describe("UX-G046 company invite server-side state ownership", () => {
  it("invalid links render the retry-safe blocked journey without readiness probing", async () => {
    vi.mocked(getPublicJoinPreview).mockResolvedValue({ kind: "UNAVAILABLE" });
    const html = renderToStaticMarkup(await visit());
    expect(getPublicJoinPreview).toHaveBeenCalledWith(token, "COMPANY");
    expect(publicJoinUnavailable).not.toHaveBeenCalled();
    expect(html).toContain('data-preview-kind="UNAVAILABLE"');
    expect(html).not.toContain("Verify work email");
  });

  it("ready company invitation renders the company-scoped verification journey", async () => {
    vi.mocked(getPublicJoinPreview).mockResolvedValue(ready);
    const html = renderToStaticMarkup(await visit());
    expect(publicJoinUnavailable).toHaveBeenCalledOnce();
    expect(html).toContain('data-join-scope="COMPANY"');
    expect(html).toContain('data-preview-kind="READY"');
    expect(html).toContain("Verify work email");
    expect(html).not.toContain("Verification is unavailable");
  });

  it("provider/readiness failure blocks verification rather than showing a usable form", async () => {
    vi.mocked(getPublicJoinPreview).mockResolvedValue(ready);
    vi.mocked(publicJoinUnavailable).mockRejectedValue(new Error("sensitive-provider-details"));
    const html = renderToStaticMarkup(await visit());
    expect(publicJoinUnavailableCopy).toHaveBeenCalled();
    expect(html).toContain('data-blocked="Verification is temporarily unavailable."');
    expect(html).not.toContain("Verify work email");
    expect(html).not.toContain("sensitive-provider-details");
  });

  it("preview transport failure renders a retry, never suggests that an invite was accepted", async () => {
    vi.mocked(getPublicJoinPreview).mockRejectedValue(new Error("secret database error"));
    const html = renderToStaticMarkup(await visit());
    expect(html).toContain('data-preview-retry="COMPANY"');
    expect(html).not.toContain("Verify work email");
    expect(html).not.toContain("secret database error");
  });
});
