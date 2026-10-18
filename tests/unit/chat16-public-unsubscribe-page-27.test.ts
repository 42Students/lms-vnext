import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { campaignUnsubscribeTokenKind } from "@/modules/placements/public-unsubscribe-preview-service";
import CampaignUnsubscribePage from "@/app/campaign-unsubscribe/[token]/page";

vi.mock("@/modules/placements/public-unsubscribe-preview-service", () => ({
  campaignUnsubscribeTokenKind: vi.fn(),
}));
vi.mock("@/components/placements/campaign-unsubscribe-confirm", () => ({
  CampaignUnsubscribeConfirm: (props: { token: string; cell: boolean }) =>
    createElement("section", {
      "data-confirm-only": "true", "data-token": props.token,
      "data-cell": String(props.cell),
    }, "Explicit opt-out confirmation"),
}));

const token = "a".repeat(64);
const page = () => CampaignUnsubscribePage({
  params: Promise.resolve({ token }),
});
beforeEach(() => vi.resetAllMocks());

describe("chat-16 public campaign opt-out page invalid/accepted/outage UX", () => {
  it("UX-public-unsubscribe-01 GET with valid token renders explicit confirmation, never submits", async () => {
    vi.mocked(campaignUnsubscribeTokenKind).mockResolvedValue("PLACEMENT_CELL" as never);
    const html = renderToStaticMarkup(await page());
    expect(campaignUnsubscribeTokenKind).toHaveBeenCalledWith(token);
    expect(html).toContain("Stop these emails?");
    expect(html).toContain('data-confirm-only="true"');
    expect(html).toContain('data-cell="true"');
    expect(html).toContain('data-token="' + token + '"');
    expect(html).not.toContain("No preference was changed.");
  });

  it("UX-public-unsubscribe-02 unknown or expired token shows denial without opt-out mutation", async () => {
    vi.mocked(campaignUnsubscribeTokenKind).mockResolvedValue(null);
    const html = renderToStaticMarkup(await page());
    expect(html).toContain("This confirmation link is invalid or expired.");
    expect(html).toContain("No preference was changed.");
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('data-confirm-only="true"');
  });

  it("UX-public-unsubscribe-04 temporary lookup outage preserves consent and offers retry", async () => {
    vi.mocked(campaignUnsubscribeTokenKind).mockRejectedValue(
      new Error("secret-database-error"),
    );
    const html = renderToStaticMarkup(await page());
    expect(html).toContain("We couldn&#x27;t check this confirmation link right now.");
    expect(html).toContain("No preference was changed.");
    expect(html).toContain(">Retry</a>");
    expect(html).toContain('href="/campaign-unsubscribe/' + token + '"');
    expect(html).not.toContain("invalid or expired.");
    expect(html).not.toContain("secret-database-error");
    expect(html).not.toContain('data-confirm-only="true"');
  });
});
