import {
  describe,
  expect,
  it,
} from "vitest";
import {
  authenticatedSmokeConfig,
  membershipIds,
} from "../../scripts/smoke-authenticated";

describe("authenticated smoke contract", () => {
  it("requires a real session cookie and http(s) target", () => {
    expect(() =>
      authenticatedSmokeConfig(
        {},
        "https://lms.example",
      ),
    ).toThrow(
      "SMOKE_AUTH_COOKIE is required",
    );

    expect(() =>
      authenticatedSmokeConfig(
        {
          SMOKE_AUTH_COOKIE:
            "lms_session=secret",
        },
        "ftp://lms.example",
      ),
    ).toThrow(
      "must use http or https",
    );
  });

  it("parses optional tenant assertions without exposing the cookie", () => {
    const config =
      authenticatedSmokeConfig(
        {
          SMOKE_AUTH_COOKIE:
            "lms_session=secret; lms_membership=m-1",
          SMOKE_EXPECT_MEMBERSHIP_ID:
            "m-1",
          SMOKE_COLLEGE_ID:
            "college-a",
          SMOKE_FORBIDDEN_COLLEGE_ID:
            "college-b",
        },
        "https://lms.example",
      );

    expect(config).toMatchObject({
      expectedMembershipId: "m-1",
      collegeId: "college-a",
      forbiddenCollegeId:
        "college-b",
    });
    expect(
      config.baseUrl.origin,
    ).toBe(
      "https://lms.example",
    );
  });

  it("extracts membership IDs and rejects malformed responses", () => {
    expect(
      membershipIds({
        memberships: [
          { id: "membership-a" },
          { id: "membership-b" },
        ],
      }),
    ).toEqual([
      "membership-a",
      "membership-b",
    ]);

    expect(() =>
      membershipIds({
        memberships: null,
      }),
    ).toThrow(
      "unexpected shape",
    );
  });
});
