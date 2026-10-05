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
  membershipId: string,
) {
  if (!e2eSecret) {
    throw new Error(
      "E2E_AUTH_SECRET is required for authenticated browser tests",
    );
  }

  await context.addCookies([
    {
      name: E2E_IDENTITY_COOKIE_NAME,
      value: identityUid,
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: E2E_SECRET_COOKIE_NAME,
      value: e2eSecret,
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
    {
      name: membershipCookieName,
      value: membershipId,
      url: baseUrl,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

test.describe("Course browser regression", () => {
  test.skip(
    !e2eSecret,
    "Authenticated browser E2E requires E2E_AUTH_SECRET",
  );
  test.describe.configure({ mode: "serial" });

  test("learner sees only the exact Section Course and can save progress", async ({
    page,
    context,
  }) => {
    await authenticate(
      context,
      "seed-learner",
      SEED_IDS.learnerCollegeAMembership,
    );

    await page.goto("/learn/courses");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Courses",
      }),
    ).toBeVisible();

    const courseCard = page.getByRole("link", {
      name: /E2E Browser Course/,
    });
    await expect(courseCard).toContainText(
      "E2E Section A",
    );
    await courseCard.click();

    await expect(page).toHaveURL(/\/learn\/courses\/[^/]+\/home$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "E2E Browser Course",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Overview" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Learning Path" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Attendance" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Discussions" }),
    ).toBeVisible();
    await expect(
      page.getByText("About this course", { exact: true }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Learning Path" }).click();
    await expect(page).toHaveURL(/\/roadmap/);
    await expect(
      page.getByText("E2E Shared Notes", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("E2E Section A Notes", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("E2E Section B Secret", {
        exact: true,
      }),
    ).toHaveCount(0);

    const sharedArticle = page
      .getByRole("article")
      .filter({ hasText: "E2E Shared Notes" });
    const progressResponsePromise =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/api/courses/progress/",
          ) &&
          response.request().method() === "PUT",
      );
    await sharedArticle
      .getByRole("button", {
        name: "Mark as complete",
      })
      .click();
    const progressResponse =
      await progressResponsePromise;
    expect(progressResponse.ok()).toBe(true);
    await expect(
      progressResponse.json(),
    ).resolves.toMatchObject({
      progress: {
        status: "COMPLETED",
      },
    });

    await page.reload();
    const refreshedSharedArticle = page
      .getByRole("article")
      .filter({ hasText: "E2E Shared Notes" });
    await expect(
      refreshedSharedArticle.getByText(
        "Completed",
        { exact: true },
      ),
    ).toBeVisible();

    await page.getByRole("link", { name: "Attendance" }).click();
    await expect(page).toHaveURL(/\/attendanceDetail/);
    await expect(
      page.getByText("Your course attendance summary and session-by-session record.", {
        exact: true,
      }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Discussions" }).click();
    await expect(page).toHaveURL(/\/discussions/);
    await expect(
      page.getByLabel("Write a message"),
    ).toBeVisible();

    await page.getByLabel("Write a message").fill("E2E learner discussion message");
    const postPromise = page.waitForResponse(
      (response) =>
        response.url().includes("/discussions") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Post" }).click();
    expect((await postPromise).ok()).toBe(true);
    await expect(
      page.getByText("E2E learner discussion message", { exact: true }),
    ).toBeVisible();

    const deletePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/discussions/") &&
        response.request().method() === "DELETE",
    );
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete" }).click();
    expect((await deletePromise).ok()).toBe(true);
    await expect(
      page.getByText("E2E learner discussion message", { exact: true }),
    ).toHaveCount(0);
  });

  test("faculty sees shared plus exact teaching content but not a sibling Section", async ({
    page,
    context,
  }) => {
    await authenticate(
      context,
      "seed-shared-faculty",
      SEED_IDS.facultyCollegeAMembership,
    );

    await page.goto("/teach/courses");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "My Teaching Courses",
      }),
    ).toBeVisible();

    const courseCard = page.getByRole("link", {
      name: /E2E Browser Course/,
    });
    await expect(courseCard).toContainText(
      "E2E Section A",
    );
    await expect(courseCard).toContainText("PRIMARY");
    await courseCard.click();

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "E2E Browser Course",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("E2E Shared Notes", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("E2E Section A Notes", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("E2E Section B Secret", {
        exact: true,
      }),
    ).toHaveCount(0);
  });

  test("College Admin shared authoring stays Offering-wide", async ({
    page,
    context,
  }) => {
    await authenticate(
      context,
      "seed-college-admin",
      SEED_IDS.collegeAdminMembership,
    );

    await page.goto("/college/courses");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Courses",
      }),
    ).toBeVisible();
    await expect(
      page
        .getByText("E2E Browser Course", {
          exact: true,
        })
        .first(),
    ).toBeVisible();

    await page
      .getByRole("link", {
        name: "Open learning",
      })
      .click();

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "E2E Browser Course",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("E2E Learning Path", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("E2E Shared Notes", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("E2E Section A Notes", {
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByText("E2E Section B Secret", {
        exact: true,
      }),
    ).toHaveCount(0);
  });
});
