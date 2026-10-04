import {
  expect,
  test,
  type BrowserContext,
} from "@playwright/test";
import {
  E2E_IDENTITY_COOKIE_NAME,
  E2E_SECRET_COOKIE_NAME,
} from "../../src/auth/e2e-identity";
import { SEED_IDS } from "../../scripts/db-seed-data";

const baseUrl = "http://localhost:3000";
const membershipCookieName = "lms_membership";
const e2eSecret = process.env.E2E_AUTH_SECRET;

async function authenticate(
  context: BrowserContext,
  identityUid: string,
  membershipId?: string | null,
) {
  if (!e2eSecret) {
    throw new Error(
      "E2E_AUTH_SECRET is required for authenticated browser tests",
    );
  }

  await context.clearCookies();
  const cookies = [
    {
      name: E2E_IDENTITY_COOKIE_NAME,
      value: identityUid,
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax" as const,
    },
    {
      name: E2E_SECRET_COOKIE_NAME,
      value: e2eSecret,
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax" as const,
    },
  ];

  if (membershipId) {
    cookies.push({
      name: membershipCookieName,
      value: membershipId,
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax" as const,
    });
  }

  await context.addCookies(cookies);
}

test.describe("Core tenant browser acceptance", () => {
  test.skip(
    !e2eSecret,
    "Authenticated browser E2E requires E2E_AUTH_SECRET",
  );

  test("Super Admin safety scope constrains tenant administration", async ({
    page,
    context,
  }) => {
    await authenticate(
      context,
      "seed-superadmin",
    );

    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Platform overview",
      }),
    ).toBeVisible();

    const scope = page.getByLabel(
      "Super Admin scope",
    );
    const scopeResponse =
      page.waitForResponse(
        (response) =>
          response.url().endsWith(
            "/api/auth/admin-scope",
          ) &&
          response.request().method() ===
            "POST",
      );
    await scope.selectOption(
      `college:${SEED_IDS.collegeA}`,
    );
    expect((await scopeResponse).ok()).toBe(
      true,
    );

    await expect(scope).toHaveValue(
      `college:${SEED_IDS.collegeA}`,
    );
    await expect(
      page.getByText(
        /College scope · Seed College A/,
      ).first(),
    ).toBeVisible();

    await page.goto("/admin/colleges");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Colleges",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Seed College A", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Seed College B", {
        exact: true,
      }),
    ).toHaveCount(0);
  });

  test("College Admin stays inside the active college on UI and direct API reads", async ({
    page,
    context,
  }) => {
    await authenticate(
      context,
      "seed-college-admin",
      SEED_IDS.collegeAdminMembership,
    );

    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Seed College A",
      }),
    ).toBeVisible();

    await page.goto("/college");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Seed College A",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Seed College B", {
        exact: true,
      }),
    ).toHaveCount(0);

    const tamper = await page.evaluate(
      async (collegeId) => {
        const response = await fetch(
          `/api/departments?collegeId=${collegeId}`,
        );
        return {
          status: response.status,
          body: await response.json(),
        };
      },
      SEED_IDS.collegeB,
    );

    expect(tamper).toMatchObject({
      status: 403,
      body: {
        error: "FORBIDDEN",
      },
    });
  });

  test("one identity can switch between two active college memberships without leaking the previous college", async ({
    page,
    context,
  }) => {
    await authenticate(
      context,
      "seed-shared-faculty",
      SEED_IDS.facultyCollegeAMembership,
    );

    await page.goto("/dashboard");
    const switcher = page.getByLabel(
      "Active college membership",
    );
    await expect(switcher).toHaveValue(
      SEED_IDS.facultyCollegeAMembership,
    );

    const switchToB =
      page.waitForResponse(
        (response) =>
          response.url().endsWith(
            "/api/auth/memberships",
          ) &&
          response.request().method() ===
            "POST",
      );
    await switcher.selectOption(
      SEED_IDS.facultyCollegeBMembership,
    );
    expect((await switchToB).ok()).toBe(
      true,
    );
    await expect(switcher).toHaveValue(
      SEED_IDS.facultyCollegeBMembership,
    );

    await page.goto("/teach/courses");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "My Teaching Courses",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("E2E Browser Course", {
        exact: true,
      }),
    ).toHaveCount(0);

    const switchBack = page.waitForResponse(
      (response) =>
        response.url().endsWith(
          "/api/auth/memberships",
        ) &&
        response.request().method() ===
          "POST",
    );
    await page
      .getByLabel(
        "Active college membership",
      )
      .selectOption(
        SEED_IDS.facultyCollegeAMembership,
      );
    expect((await switchBack).ok()).toBe(
      true,
    );

    await page.goto("/teach/courses");
    await expect(
      page.getByText("E2E Browser Course", {
        exact: true,
      }),
    ).toBeVisible();
  });
});
