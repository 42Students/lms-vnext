import { describe, expect, it } from "vitest";
import { publicRecruiterJoinedNotification } from "@/modules/placements/public-join/join-notification-model";

describe("TPO-campaigns-public-29 recruiter joined notification", () => {
  it("uses the exact company-join bell copy", () => {
    expect(publicRecruiterJoinedNotification({
      name: "Asha Kumari", companyName: "Example Limited", scope: "COMPANY",
    })).toEqual({
      title: "Asha joined from Example Limited",
      body: "Through your company link. They can now request a drive.",
      actionHref: "/tpo/recruiters",
    });
  });
  it("distinguishes the public college link", () => {
    expect(publicRecruiterJoinedNotification({
      name: "Asha Kumari", companyName: "Example Limited", scope: "COLLEGE",
    }).body).toBe("Through your public link. They can now request a drive.");
  });
});
