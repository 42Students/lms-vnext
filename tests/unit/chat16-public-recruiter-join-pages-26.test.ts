import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { getPublicJoinPreview } from "@/modules/placements/public-join/preview-service";
import {
  publicJoinUnavailable, publicJoinUnavailableCopy,
} from "@/modules/placements/public-join/readiness-state";
import CompanyJoinPage from "@/app/company-join/[token]/page";
import CollegeJoinPage from "@/app/college-join/[token]/page";

vi.mock("@/modules/placements/public-join/preview-service", () => ({
  getPublicJoinPreview: vi.fn(),
}));
vi.mock("@/modules/placements/public-join/readiness-state", () => ({
  publicJoinUnavailable: vi.fn(), publicJoinUnavailableCopy: vi.fn(),
}));
vi.mock("@/components/placements/public-recruiter-join-form", () => ({
  PublicRecruiterJoinForm: (props: {
    token: string; scope: string; blockedReason: string | null;
  }) => createElement("section", {
    "data-join-form": "true", "data-scope": props.scope,
    "data-token": props.token, "data-blocked": props.blockedReason ?? "",
  }, "Join request"),
}));
vi.mock("@/components/placements/public-join-preview-retry", () => ({
  PublicJoinPreviewRetry: (props: { token: string; scope: string }) =>
    createElement("section", {
      role: "alert", "data-scope": props.scope, "data-token": props.token,
    }, "Unable to load invitation. No changes were made."),
}));

const token = "a".repeat(48);
const params = { params: Promise.resolve({ token }) };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(publicJoinUnavailable).mockResolvedValue(null);
  vi.mocked(publicJoinUnavailableCopy).mockReturnValue(null);
  vi.mocked(getPublicJoinPreview).mockResolvedValue({kind:"READY",collegeName:"Example College",companyDomain:"example.org",companyName:"Company"});
});

describe("chat-16 real public recruiter join page SSR and invitation failure recovery", () => {
  it.each([
    ["COMPANY", CompanyJoinPage],
    ["COLLEGE", CollegeJoinPage],
  ] as const)(
    "UX-public-join-01 %s form never changes the requested audience or token",
    async (scope, render) => {
      const html = renderToStaticMarkup(await render(params));
      expect(html).toContain('data-join-form="true"');
      expect(html).toContain('data-scope="' + scope + '"');
      expect(html).toContain('data-token="' + token + '"');
      expect(getPublicJoinPreview).toHaveBeenCalledWith(token, scope);
      expect(publicJoinUnavailable).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    ["COMPANY", CompanyJoinPage],
    ["COLLEGE", CollegeJoinPage],
  ] as const)(
    "UX-public-join-02 %s temporary preview outage renders safe retry, not a blank or completed join",
    async (scope, render) => {
      vi.mocked(getPublicJoinPreview).mockRejectedValue(new Error("private-database-error"));
      const html = renderToStaticMarkup(await render(params));
      expect(html).toContain('role="alert"');
      expect(html).toContain("No changes were made.");
      expect(html).not.toContain("private-database-error");
      expect(html).not.toContain('data-join-form="true"');
      expect(publicJoinUnavailable).not.toHaveBeenCalled();
      expect(getPublicJoinPreview).toHaveBeenCalledWith(token, scope);
    },
  );

  it.each([
    ["COMPANY", CompanyJoinPage],
    ["COLLEGE", CollegeJoinPage],
  ] as const)(
    "UX-public-join-04 %s readiness outage fails closed even when invitation preview loads",
    async (scope, render) => {
      vi.mocked(publicJoinUnavailable).mockRejectedValue(new Error("private provider secret"));
      const explanation =
        "Recruiter verification is temporarily unavailable. The placement cell must enable verified client networking, email-code delivery and public join storage before recruiters can join.";
      vi.mocked(publicJoinUnavailableCopy).mockReturnValue(explanation);
      const html = renderToStaticMarkup(await render(params));
      expect(publicJoinUnavailableCopy).toHaveBeenCalledWith("RATE_TABLE_MISSING");
      expect(html).toContain(explanation);
      expect(html).toContain('data-scope="' + scope + '"');
      expect(html).not.toContain("private provider secret");
    },
  );

  it.each([
    ["COMPANY", CompanyJoinPage],
    ["COLLEGE", CollegeJoinPage],
  ] as const)(
    "UX-public-join-05 %s invalid or revoked invitation never probes email/provider readiness",
    async (scope, render) => {
      vi.mocked(getPublicJoinPreview).mockResolvedValue({kind:"UNAVAILABLE"});
      const html = renderToStaticMarkup(await render(params));
      expect(html).toContain('data-join-form="true"');
      expect(html).toContain('data-scope="' + scope + '"');
      expect(publicJoinUnavailable).not.toHaveBeenCalled();
      expect(publicJoinUnavailableCopy).not.toHaveBeenCalled();
    },
  );

  it("UX-public-join-03 unavailable campaign is explicitly blocked instead of falsely accepting applications", async () => {
    vi.mocked(publicJoinUnavailable).mockResolvedValue("RATE_TABLE_MISSING");
    vi.mocked(publicJoinUnavailableCopy).mockReturnValue(
      "Recruiter verification is temporarily unavailable. The placement cell must enable verified client networking, email-code delivery and public join storage before recruiters can join.",
    );
    const html = renderToStaticMarkup(await CollegeJoinPage(params));
    expect(html).toContain("Recruiter verification is temporarily unavailable. The placement cell must enable verified client networking, email-code delivery and public join storage before recruiters can join.");
    expect(html).toContain('data-scope="COLLEGE"');
    expect(html).not.toContain("private-database-error");
  });
});
