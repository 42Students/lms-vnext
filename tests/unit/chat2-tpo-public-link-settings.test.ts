import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TPO_SETTINGS_NAV_GROUPS } from "@/components/placements/tpo-settings-nav";
import { PUBLIC_JOIN_LINK_COPY } from "@/modules/placements/tpo-public-join-link-model";

describe("TPO-settings-audit-55 recruiter link", () => {
  it("TPO-settings-audit-55 is reachable through settings navigation", () => {
    // Legacy shows the card inside the Recruiters settings section, not as an eleventh section.
    const links = TPO_SETTINGS_NAV_GROUPS.flatMap(
      (group): readonly { href: string; label: string }[] => group.items,
    );
    expect(links.some(item => item.href === "/tpo/settings/recruiters" && item.label === "Recruiters")).toBe(true);
    const page = readFileSync("src/app/(authenticated)/tpo/settings/recruiters/page.tsx", "utf8");
    expect(page).toContain("TpoPublicJoinLinkCard");
  });
  it("TPO-settings-audit-55 uses exact legacy labels", () => {
    expect(PUBLIC_JOIN_LINK_COPY.college).toBe("Public link for recruiters");
    expect(PUBLIC_JOIN_LINK_COPY.publicInitial).toBe("Make the link");
    expect(PUBLIC_JOIN_LINK_COPY.replace).toBe("New link");
    expect(PUBLIC_JOIN_LINK_COPY.copied).toBe("Link copied");
  });
});
