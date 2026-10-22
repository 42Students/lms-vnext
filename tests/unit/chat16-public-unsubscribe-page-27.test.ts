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
    expect(campaignUnsubscribeTokenKind).not.toHaveBeenCalled();
    expect(html).toContain("Stop these emails?");
    expect(html).toContain('data-confirm-only="true"');
    expect(html).toContain('data-cell="true"');
    expect(html).toContain('data-token="' + token + '"');
    expect(html).toContain("No preference was changed.");
  });

  it("UX-public-unsubscribe-02 GET cannot distinguish valid and expired links", async () => {
    vi.mocked(campaignUnsubscribeTokenKind).mockResolvedValue(null);
    const html = renderToStaticMarkup(await page());
    expect(campaignUnsubscribeTokenKind).not.toHaveBeenCalled();
    expect(html).toContain("No preference was changed.");
    expect(html).toContain('data-confirm-only="true"');
    expect(html).not.toContain("invalid or expired");
  });

  it("UX-public-unsubscribe-04 GET remains safe when token lookup would fail", async () => {
    vi.mocked(campaignUnsubscribeTokenKind).mockRejectedValue(new Error("secret-database-error"));
    const html = renderToStaticMarkup(await page());
    expect(campaignUnsubscribeTokenKind).not.toHaveBeenCalled();
    expect(html).toContain("Stop these emails?");
    expect(html).toContain('data-token="' + token + '"');
    expect(html).not.toContain("secret-database-error");
    expect(html).toContain("No preference was changed.");
  });
});
