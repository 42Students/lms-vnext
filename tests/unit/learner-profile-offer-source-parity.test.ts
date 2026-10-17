import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(new URL("../../" + path, import.meta.url), "utf8");
}

describe("Learner profile checklist and offer confirmation source contracts", () => {
  it("shows a validated contact deep link and real persisted document checklist", () => {
    const page = read("src/app/(authenticated)/learn/profile/page.tsx");
    const workspace = read("src/components/profile/learner-profile-workspace.tsx");
    expect(page).toContain("learnerProfileResolveSection(query.section)");
    expect(page).toContain("initialSection={initialSection}");
    expect(workspace).toContain("learnerProfileChecklist(document)");
    expect(workspace).toContain('id="contacts"');
    expect(workspace).toContain("scrollIntoView");
    expect(workspace).toContain("Profile completion checklist");
    expect(workspace).toContain("/api/profile/me");
    expect(read("src/app/(authenticated)/learn/profile/loading.tsx")).toContain("Loading");
    expect(read("src/app/(authenticated)/learn/profile/error.tsx")).toContain("Retry");
  });

  it("requires explicit offer acceptance confirmation with recorded terms", () => {
    const offers = read("src/components/placements/learner-placement-offers.tsx");
    expect(offers).toContain("Review the recorded offer terms. Acceptance is only submitted after you confirm.");
    expect(offers).toContain("What accepting this offer changes");
    expect(offers).toContain("Yes, accept");
    expect(offers).toContain("blockedByAnotherAcceptedOffer");
    expect(offers).toContain("setConfirmOffer(item)");
    expect(offers).toContain('respond(preview.offerId, "ACCEPT")');
    expect(offers).not.toContain('respond(\n                      item.offerId,\n                      "ACCEPT",');
    expect(read("src/app/api/placements/offers/[offerId]/actions/route.ts"))
      .toContain("isSameOriginRequest(request)");
    for (const route of ["learn/my-placements/offers", "learn/my-placements/placement"]) {
      expect(read("src/app/(authenticated)/" + route + "/loading.tsx")).toContain("Loading");
      expect(read("src/app/(authenticated)/" + route + "/error.tsx")).toContain("Retry");
    }
  });
});
