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
  membershipId: string,
) {
  if (!e2eSecret) {
    throw new Error(
      "E2E_AUTH_SECRET is required for authenticated browser tests",
    );
  }

  await context.clearCookies();
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

async function createPublishedOpportunity(
  page: Page,
  unique: string,
) {
  const title = `E2E Placement Engineer ${unique}`;

  await page.goto("/tpo/placements");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Placement Operations",
    }),
  ).toBeVisible();

  await page
    .getByRole("link", {
      name: "New opportunity",
    })
    .click();

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "New placement opportunity",
    }),
  ).toBeVisible();

  await page
    .getByLabel("Company name")
    .fill(`E2E Placement Co ${unique}`);
  await page
    .getByLabel("Primary domain")
    .fill(`e2e-${unique}.example`);
  await page
    .getByLabel("Job title")
    .fill(title);
  await page
    .getByLabel("Description")
    .fill(
      "End-to-end placement browser acceptance role.",
    );
  await page
    .getByLabel("Locations")
    .fill("Hyderabad");
  await page
    .getByLabel("Minimum CGPA")
    .fill("7.25");
  await page
    .getByLabel("Publish immediately after creation")
    .check();

  const createJobResponse =
    page.waitForResponse(
      (response) =>
        response.url().endsWith(
          "/api/placements/jobs",
        ) &&
        response.request().method() ===
          "POST",
    );

  await page
    .getByRole("button", {
      name: "Create & publish",
    })
    .click();

  expect((await createJobResponse).ok()).toBe(
    true,
  );

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: title,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("PUBLISHED", {
      exact: true,
    }),
  ).toBeVisible();

  return title;
}

test.describe("Placements browser regression", () => {
  test.skip(
    !e2eSecret,
    "Authenticated browser E2E requires E2E_AUTH_SECRET",
  );
  test.describe.configure({ mode: "serial" });

  test("TPO and learner complete a placement flow through the UI", async ({
    page,
    context,
  }) => {
    const unique = Date.now().toString();

    await authenticate(
      context,
      "seed-shared-faculty",
      SEED_IDS.facultyCollegeAMembership,
    );

    const title =
      await createPublishedOpportunity(
        page,
        unique,
      );

    await page
      .getByRole("button", {
        name: "Add round",
      })
      .click();
    await page
      .getByPlaceholder("Round name")
      .fill("Technical interview");

    const configResponse =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/evaluation-config",
          ) &&
          response.request().method() ===
            "PUT",
      );
    await page
      .getByRole("button", {
        name: "Save evaluation plan",
      })
      .click();
    expect((await configResponse).ok()).toBe(
      true,
    );

    await expect(
      page.getByText(
        "Technical interview",
        { exact: true },
      ),
    ).toBeVisible();

    await authenticate(
      context,
      "seed-learner",
      SEED_IDS.learnerCollegeAMembership,
    );
    await page.goto("/learn/placements");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Placements",
      }),
    ).toBeVisible();

    const opportunity = page
      .getByRole("article")
      .filter({ hasText: title });
    await expect(opportunity).toBeVisible();
    await expect(
      opportunity.getByText(
        "Eligible With Missing Evidence",
        { exact: true },
      ),
    ).toBeVisible();

    const applicationResponse =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/applications",
          ) &&
          response.request().method() ===
            "POST",
      );
    await opportunity
      .getByRole("button", {
        name: "Apply in LMS",
      })
      .click();
    expect(
      (await applicationResponse).ok(),
    ).toBe(true);

    await expect(
      opportunity.getByText(
        /Applied · Internal/,
      ),
    ).toBeVisible();

    await authenticate(
      context,
      "seed-shared-faculty",
      SEED_IDS.facultyCollegeAMembership,
    );
    await page.goto("/tpo/placements");

    const jobRow = page
      .locator("div")
      .filter({ hasText: title })
      .filter({
        has: page.getByRole("link", {
          name: "Open drive",
        }),
      })
      .last();
    await expect(jobRow).toBeVisible();
    await jobRow
      .getByRole("link", {
        name: "Open drive",
      })
      .click();

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: title,
      }),
    ).toBeVisible();

    const screeningRow = page
      .locator("div")
      .filter({ hasText: "Seed Learner" })
      .filter({
        has: page.getByRole("button", {
          name: "Shortlist",
        }),
      })
      .first();

    const screeningResponse =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/screening/actions",
          ) &&
          response.request().method() ===
            "POST",
      );
    await screeningRow
      .getByRole("button", {
        name: "Shortlist",
      })
      .click();
    expect(
      (await screeningResponse).ok(),
    ).toBe(true);

    const roundArticle = page
      .getByRole("article")
      .filter({
        hasText: "Technical interview",
      })
      .last();
    await roundArticle
      .getByText("Schedule round", {
        exact: true,
      })
      .click();

    await roundArticle
      .getByLabel("Date & time")
      .fill("2026-10-20T10:00");
    await roundArticle
      .getByLabel("Venue")
      .fill("Main Auditorium");

    const scheduleResponse =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/rounds/",
          ) &&
          response.url().endsWith(
            "/actions",
          ) &&
          response.request().method() ===
            "POST",
      );
    await roundArticle
      .getByRole("button", {
        name: "Schedule round",
      })
      .click();
    expect(
      (await scheduleResponse).ok(),
    ).toBe(true);

    await expect(
      page.getByText("SCHEDULED", {
        exact: true,
      }),
    ).toBeVisible();

    const completedRound = page
      .getByRole("article")
      .filter({
        hasText: "Technical interview",
      })
      .last();
    await completedRound
      .getByText(
        "Reschedule / manage round",
        { exact: true },
      )
      .click();

    const completeResponse =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/rounds/",
          ) &&
          response.url().endsWith(
            "/actions",
          ) &&
          response.request().method() ===
            "POST",
      );
    await completedRound
      .getByRole("button", {
        name: "Complete round",
      })
      .click();
    expect(
      (await completeResponse).ok(),
    ).toBe(true);

    const candidateResult = page
      .locator("div")
      .filter({ hasText: "Seed Learner" })
      .filter({
        has: page.getByRole("button", {
          name: "Stage result",
        }),
      })
      .last();

    await candidateResult
      .getByLabel("Score %")
      .fill("88");

    const stageResponse =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/results",
          ) &&
          response.request().method() ===
            "POST",
      );
    await candidateResult
      .getByRole("button", {
        name: "Stage result",
      })
      .click();
    expect((await stageResponse).ok()).toBe(
      true,
    );

    const applyResponse =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/api/placements/results/",
          ) &&
          response.url().endsWith(
            "/actions",
          ) &&
          response.request().method() ===
            "POST",
      );
    await page
      .getByRole("button", {
        name: "Apply result",
      })
      .click();
    expect((await applyResponse).ok()).toBe(
      true,
    );

    await authenticate(
      context,
      "seed-learner",
      SEED_IDS.learnerCollegeAMembership,
    );
    await page.goto("/learn/placements");

    const journey = page
      .getByRole("article")
      .filter({ hasText: title })
      .first();
    await expect(
      journey.getByText(
        "Technical interview",
        { exact: false },
      ),
    ).toBeVisible();
    await expect(
      journey.getByText("Pass", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      journey.getByText("88%", {
        exact: true,
      }),
    ).toBeVisible();
  });
});
