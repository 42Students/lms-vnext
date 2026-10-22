import { describe, expect, it } from "vitest";
import {
  PUBLIC_JOIN_LINK_COPY, publicJoinLinkPath, tpoPublicJoinLinkChangeSchema,
} from "@/modules/placements/tpo-public-join-link-model";

describe("TPO-companies-01 public company link contract", () => {
  it("preserves legacy labels exactly", () => {
    expect(PUBLIC_JOIN_LINK_COPY.company).toBe("Company link");
    expect(PUBLIC_JOIN_LINK_COPY.replaceTitle).toBe("Make a new link?");
    expect(PUBLIC_JOIN_LINK_COPY.replaceExplanation).toBe("A new public link; the old one stopped working.");
    expect(PUBLIC_JOIN_LINK_COPY.once).toBe("Copy it now: for safety it is shown only once.");
    expect(PUBLIC_JOIN_LINK_COPY.copied).toBe("Link copied");
  });
  it("rejects cross-college and arbitrary company fields", () => {
    const valid = {
      scope: "COMPANY", companyId: "ea9c1d0f-985c-4c68-9abd-bc560075e8ce",
      action: "CREATE", confirmed: true,
    };
    expect(tpoPublicJoinLinkChangeSchema.safeParse(valid).success).toBe(true);
    expect(tpoPublicJoinLinkChangeSchema.safeParse({
      ...valid, collegeId: "ea9c1d0f-985c-4c68-9abd-bc560075e8ce",
    }).success).toBe(false);
    expect(tpoPublicJoinLinkChangeSchema.safeParse({
      scope: "COLLEGE", action: "REPLACE", confirmed: true, companyId: valid.companyId,
    }).success).toBe(false);
    expect(tpoPublicJoinLinkChangeSchema.safeParse({
      ...valid, confirmed: false,
    }).success).toBe(false);
  });
  it("builds scope-specific public join paths without leaking a raw token into analytics", () => {
    expect(publicJoinLinkPath("COMPANY", "urlSafeToken")).toBe("/company-join/urlSafeToken");
    expect(publicJoinLinkPath("COLLEGE", "urlSafeToken")).toBe("/college-join/urlSafeToken");
  });
});
