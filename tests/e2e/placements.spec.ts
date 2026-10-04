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
  const publishResponse =
    page.waitForResponse(
      (response) =>
        response.url().includes(
          "/api/placements/jobs/",
        ) &&
        response.url().endsWith(
          "/status",
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
  expect((await publishResponse).ok()).toBe(
    true,
  );
  await page.waitForURL(
    /\/tpo\/placements\/jobs\//,
    { timeout: 20_000 },
  );

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: title,
    }),
  ).toBeVisible({ timeout: 20_000 });
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
    test.setTimeout(90_000);
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
      page
        .getByText(
          "Technical interview",
          { exact: true },
        )
        .first(),
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
      .locator("summary")
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
      page
        .getByText("SCHEDULED", {
          exact: true,
        })
        .first(),
    ).toBeVisible();

    const completedRound = page
      .getByRole("article")
      .filter({
        hasText: "Technical interview",
      })
      .last();
    const completeButton =
      completedRound.getByRole("button", {
        name: "Complete round",
      });
    if (!(await completeButton.isVisible())) {
      await completedRound
        .locator("summary")
        .click();
    }

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
    await completeButton.click();
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

  test("recruiter uses explicit employer grants and stages results for TPO review", async ({
    page,
    context,
  }) => {
    test.setTimeout(90_000);
    const unique =
      "hr-" + Date.now().toString();
    const companyName =
      `E2E Placement Co ${unique}`;

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
      .fill("HR interview");

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

    await page.goto("/tpo/placements");
    const recruiterSection = page
      .getByRole("heading", {
        name: "Recruiter access",
      })
      .locator("..")
      .locator("..");
    await recruiterSection
      .getByLabel(
        "Employer relationship",
      )
      .selectOption({
        label: companyName,
      });
    await recruiterSection
      .getByLabel("Recruiter email")
      .fill(
        "recruiter-e2e@example.com",
      );
    await recruiterSection
      .getByLabel("Recruiter title")
      .fill("Talent Partner");

    const grantResponse =
      page.waitForResponse(
        (response) =>
          response.url().endsWith(
            "/api/placements/recruiters",
          ) &&
          response.request().method() ===
            "POST",
      );
    await recruiterSection
      .getByRole("button", {
        name: "Grant access",
      })
      .click();
    expect((await grantResponse).ok()).toBe(
      true,
    );
    await expect(
      recruiterSection.getByText(
        "E2E Recruiter",
        { exact: true },
      ),
    ).toBeVisible();

    await authenticate(
      context,
      "seed-learner",
      SEED_IDS.learnerCollegeAMembership,
    );
    await page.goto("/learn/placements");
    const opportunity = page
      .getByRole("article")
      .filter({ hasText: title });
    await expect(opportunity).toBeVisible();

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
    await jobRow
      .getByRole("link", {
        name: "Open drive",
      })
      .click();

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
        hasText: "HR interview",
      })
      .last();
    await roundArticle
      .locator("summary")
      .click();
    await roundArticle
      .getByLabel("Date & time")
      .fill("2026-10-21T10:00");
    await roundArticle
      .getByLabel("Venue")
      .fill("Placement Hall");

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

    await authenticate(
      context,
      "seed-placement-recruiter-e2e",
    );
    await page.goto("/hr/placements");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Hiring Workspace",
      }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "Employer Recruiter",
        { exact: true },
      ).first(),
    ).toBeVisible();
    await expect(
      page.getByLabel(
        "Active college membership",
      ),
    ).toHaveCount(0);

    const recruiterJob = page
      .getByRole("article")
      .filter({ hasText: title });
    await expect(recruiterJob).toBeVisible();
    await recruiterJob
      .getByRole("link", {
        name: "Open hiring flow",
      })
      .click();

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: title,
      }),
    ).toBeVisible();
    await expect(
      page.getByLabel("Internal comment"),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", {
        name: "Apply result",
      }),
    ).toHaveCount(0);

    const recruiterRound = page
      .getByRole("article")
      .filter({ hasText: "HR interview" });
    const recruiterCandidate =
      recruiterRound
        .locator("div")
        .filter({
          hasText: "Seed Learner",
        })
        .filter({
          has: page.getByRole("button", {
            name: "Stage result",
          }),
        })
        .last();
    await recruiterCandidate
      .getByLabel("Score %")
      .fill("91");

    const hrStageResponse =
      page.waitForResponse(
        (response) =>
          response.url().includes(
            "/rounds/",
          ) &&
          response.url().endsWith(
            "/results",
          ) &&
          response.request().method() ===
            "POST",
      );
    await recruiterCandidate
      .getByRole("button", {
        name: "Stage result",
      })
      .click();
    expect(
      (await hrStageResponse).ok(),
    ).toBe(true);
    await expect(
      recruiterRound.getByText(
        "Staged",
        { exact: true },
      ),
    ).toBeVisible();

    await authenticate(
      context,
      "seed-shared-faculty",
      SEED_IDS.facultyCollegeAMembership,
    );
    await page.goto("/tpo/placements");
    const tpoJobRow = page
      .locator("div")
      .filter({ hasText: title })
      .filter({
        has: page.getByRole("link", {
          name: "Open drive",
        }),
      })
      .last();
    await tpoJobRow
      .getByRole("link", {
        name: "Open drive",
      })
      .click();

    const tpoRound = page
      .getByRole("article")
      .filter({ hasText: "HR interview" })
      .last();
    const completeButton =
      tpoRound.getByRole("button", {
        name: "Complete round",
      });
    if (!(await completeButton.isVisible())) {
      await tpoRound
        .locator("summary")
        .click();
    }

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
    await completeButton.click();
    expect(
      (await completeResponse).ok(),
    ).toBe(true);

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
      journey.getByText("Pass", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      journey.getByText("91%", {
        exact: true,
      }),
    ).toBeVisible();
  });
});
