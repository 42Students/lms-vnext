import {
  expect,
  test,
  type BrowserContext,
  type Page,
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

type OnboardedBrowserPerson = {
  identityUid: string;
  membershipId: string;
};

async function onboardBrowserPerson(
  page: Page,
  input: {
    displayName: string;
    phone: string;
    email: string;
    role:
      | "College Admin"
      | "Faculty"
      | "Learner";
  },
): Promise<OnboardedBrowserPerson> {
  await page
    .getByRole("button", {
      name: "Onboard person",
    })
    .first()
    .click();

  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Display name")
    .fill(input.displayName);
  await dialog
    .getByLabel("Phone")
    .fill(input.phone);
  await dialog
    .getByLabel("Email · optional")
    .fill(input.email);

  const learner =
    dialog.getByLabel("Learner");
  if (input.role !== "Learner") {
    await learner.uncheck();
    await dialog
      .getByLabel(input.role)
      .check();
  }

  const responsePromise =
    page.waitForResponse(
      (response) =>
        response.url().endsWith(
          "/api/people/onboard",
        ) &&
        response.request().method() ===
          "POST",
    );

  await dialog
    .getByRole("button", {
      name: "Onboard person",
    })
    .click();

  const response =
    await responsePromise;
  expect(response.ok()).toBe(true);
  const payload = await response.json();

  await expect(
    page
      .getByRole("table")
      .getByText(input.displayName, {
        exact: true,
      }),
  ).toBeVisible();

  return {
    identityUid:
      payload.person.user.identityUid,
    membershipId:
      payload.person.membership.id,
  };
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
    const collegesTable = page.getByRole("table");
    await expect(
      collegesTable.getByText("Seed College A", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      collegesTable.getByText("Seed College B", {
        exact: true,
      }),
    ).toHaveCount(0);
  });

  test("runs tenant creation, scoped administration, onboarding, lifecycle denial, session restoration and logout", async ({
    page,
    context,
  }) => {
    const organizationName =
      "E2E Acceptance Organization";
    const collegeName =
      "E2E Acceptance College";
    const collegeCode = "E2E-ACCEPT";
    const superDepartment =
      "E2E Super Department";
    const adminDepartment =
      "E2E College Admin Department";

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

    await page.goto("/admin/organizations");
    await page
      .locator("#organization-name")
      .fill(organizationName);
    await page
      .getByRole("button", {
        name: "Create organization",
      })
      .click();
    await expect(
      page
        .getByRole("table")
        .getByText(organizationName, {
          exact: true,
        }),
    ).toBeVisible();

    await page.goto("/admin/colleges");
    await page
      .locator("#college-organization")
      .selectOption({
        label: organizationName,
      });
    await page
      .locator("#college-name")
      .fill(collegeName);
    await page
      .locator("#college-code")
      .fill(collegeCode);
    await page
      .getByRole("button", {
        name: "Create college",
      })
      .click();
    await expect(
      page
        .getByRole("table")
        .getByText(collegeName, {
          exact: true,
        }),
    ).toBeVisible();

    const scope =
      page.getByLabel("Super Admin scope");
    const scopeResponse =
      page.waitForResponse(
        (response) =>
          response.url().endsWith(
            "/api/auth/admin-scope",
          ) &&
          response.request().method() ===
            "POST",
      );
    await scope.selectOption({
      label:
        `${organizationName} · ${collegeName}`,
    });
    expect((await scopeResponse).ok()).toBe(
      true,
    );

    await page.goto("/admin/departments");
    await page
      .locator("#department-name")
      .fill(superDepartment);
    await page
      .getByRole("button", {
        name: "Create department",
      })
      .click();
    await expect(
      page
        .getByRole("table")
        .getByText(superDepartment, {
          exact: true,
        }),
    ).toBeVisible();

    await page.goto("/admin/people");
    const collegeAdmin =
      await onboardBrowserPerson(page, {
        displayName:
          "E2E Acceptance College Admin",
        phone: "+919100000101",
        email:
          "e2e.acceptance.admin@example.com",
        role: "College Admin",
      });

    await authenticate(
      context,
      collegeAdmin.identityUid,
      collegeAdmin.membershipId,
    );
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: collegeName,
      }),
    ).toBeVisible();

    await page.reload();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: collegeName,
      }),
    ).toBeVisible();

    await page.goto("/college/departments");
    await page
      .locator("#department-name")
      .fill(adminDepartment);
    await page
      .getByRole("button", {
        name: "Create department",
      })
      .click();
    await expect(
      page
        .getByRole("table")
        .getByText(adminDepartment, {
          exact: true,
        }),
    ).toBeVisible();

    await page.goto("/college/people");
    const faculty =
      await onboardBrowserPerson(page, {
        displayName:
          "E2E Acceptance Faculty",
        phone: "+919100000102",
        email:
          "e2e.acceptance.faculty@example.com",
        role: "Faculty",
      });
    const learner =
      await onboardBrowserPerson(page, {
        displayName:
          "E2E Acceptance Learner",
        phone: "+919100000103",
        email:
          "e2e.acceptance.learner@example.com",
        role: "Learner",
      });

    const facultyRow = page
      .getByRole("row")
      .filter({
        hasText:
          "E2E Acceptance Faculty",
      });
    const suspendButton =
      facultyRow.getByRole("button", {
        name: "Suspend",
      });

    if (await suspendButton.isVisible()) {
      await suspendButton.click();
      const suspendDialog =
        page.getByRole("dialog");
      await suspendDialog
        .getByLabel("Suspension reason")
        .fill(
          "Browser acceptance suspension",
        );

      const suspendResponse =
        page.waitForResponse(
          (response) =>
            response.url().includes(
              `/api/people/${faculty.membershipId}/lifecycle`,
            ) &&
            response.request().method() ===
              "PATCH",
        );
      await suspendDialog
        .getByRole("button", {
          name: "Suspend membership",
        })
        .click();
      expect(
        (await suspendResponse).ok(),
      ).toBe(true);
    } else {
      await expect(
        facultyRow.getByRole("button", {
          name: "Reactivate",
        }),
      ).toBeVisible();
    }

    await authenticate(
      context,
      faculty.identityUid,
      faculty.membershipId,
    );
    await page.goto("/dashboard");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Choose another active college",
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Your previously selected college membership is no longer active.",
        { exact: false },
      ),
    ).toBeVisible();

    await authenticate(
      context,
      learner.identityUid,
      learner.membershipId,
    );
    await page.goto("/dashboard");
    await expect(
      page.getByRole("button", {
        name: "Sign out",
      }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: "Sign out",
      })
      .click();

    await expect(page).toHaveURL(
      `${baseUrl}/`,
    );
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "LMS vNext",
      }),
    ).toBeVisible();

    await page.goto("/dashboard");
    await expect(page).toHaveURL(
      `${baseUrl}/`,
    );
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
