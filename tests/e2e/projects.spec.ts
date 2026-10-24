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

test.describe("Projects browser regression", () => {
  test.skip(
    !e2eSecret,
    "Authenticated browser E2E requires E2E_AUTH_SECRET",
  );

  test("admin creation/team setup gives learner and mentor the exact workspace", async ({
    page,
    context,
  }) => {
    await authenticate(
      context,
      "seed-college-admin",
      SEED_IDS.collegeAdminMembership,
    );

    await page.goto("/college/projects");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Projects",
      }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Create Project" })
      .click();

    const createDialog = page.getByRole("dialog", {
      name: "Create Project",
    });
    await createDialog
      .getByLabel("Assigned template")
      .selectOption({ index: 0 });

    const unique = Date.now().toString();
    const title = `E2E Browser Project ${unique}`;
    await createDialog
      .getByLabel("Project title")
      .fill(title);
    await createDialog
      .getByLabel("Slug")
      .fill(`e2e-browser-project-${unique}`);

    const createResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/projects") &&
        response.request().method() === "POST",
    );
    await createDialog
      .getByRole("button", { name: "Create Project" })
      .click();
    expect((await createResponse).ok()).toBe(true);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: title,
      }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Add teammate" })
      .click();
    let teamDialog = page.getByRole("dialog", {
      name: "Add Project teammate",
    });
    await expect(teamDialog.getByLabel("Project member")).toContainText(
      "Seed Learner",
    );
    await teamDialog
      .getByLabel("Project member")
      .selectOption(SEED_IDS.learnerCollegeAMembership);
    await teamDialog
      .getByRole("button", { name: "Add teammate" })
      .click();
    await expect(
      page.getByText("Seed Learner", { exact: true }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Add teammate" })
      .click();
    teamDialog = page.getByRole("dialog", {
      name: "Add Project teammate",
    });
    await teamDialog
      .getByLabel("Project role")
      .selectOption("MENTOR");
    await expect(teamDialog.getByLabel("Project member")).toContainText(
      "Seed Shared Faculty",
    );
    await teamDialog
      .getByLabel("Project member")
      .selectOption(SEED_IDS.facultyCollegeAMembership);
    await teamDialog
      .getByLabel("Primary mentor")
      .check();
    await teamDialog
      .getByRole("button", { name: "Add teammate" })
      .click();

    await expect(
      page
        .getByRole("article")
        .filter({ hasText: "Seed Shared Faculty" }),
    ).toContainText("Primary mentor");

    await authenticate(
      context,
      "seed-learner",
      SEED_IDS.learnerCollegeAMembership,
    );
    await page.goto("/learn/projects");
    const learnerProject = page.getByRole("link", {
      name: new RegExp(title),
    });
    await expect(learnerProject).toBeVisible();
    await learnerProject.click();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: title,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Add teammate" }),
    ).toHaveCount(0);

    await authenticate(
      context,
      "seed-shared-faculty",
      SEED_IDS.facultyCollegeAMembership,
    );
    await page.goto("/mentor/projects");
    const mentorProject = page.getByRole("link", {
      name: new RegExp(title),
    });
    await expect(mentorProject).toBeVisible();
    await mentorProject.click();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: title,
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Seed Learner", { exact: true }),
    ).toBeVisible();

    // The project created above is a genuine, seeded, authorized workspace.
    // Exercise all seven prototype tabs in its empty/newly-created state.
    const detailPath=new URL(page.url()).pathname;
    for(const [key,label] of [
      ["overview","Overview"],["board","Board"],["sprints","Sprints & releases"],
      ["team","Team & meetings"],["performance","Performance"],
      ["resources","Resources"],["activity","Activity"],
    ] as const){
      await page.goto(detailPath+"?tab="+key);
      await expect(page.getByRole("heading",{level:1,name:title})).toBeVisible();
      await expect(page.getByRole("navigation",{name:"Project sections"})
        .getByRole("link",{name:label,exact:true})).toHaveAttribute("aria-current","page");
      await expect(page.getByText("No project content available for this section.")).toHaveCount(0);
    }

    // The Mentor prototype team actions must mutate saved role labels, not
    // merely flip a local icon. Primary Mentors may offer both team roles.
    await page.goto(detailPath+"?tab=team");
    await expect(page.getByRole("button",{name:"Add teammate"})).toBeVisible();
    await expect(page.getByRole("button",{name:"Promote lead"})).toBeVisible();
    await page.getByRole("button",{name:"Promote lead"}).click();
    await expect(page.getByRole("button",{name:"Remove lead"})).toBeVisible();
    await page.getByRole("button",{name:"Edit role"}).click();
    const editor=page.getByRole("dialog",{name:/Edit Seed Learner's project responsibility/});
    await editor.getByLabel("Responsibility label").fill("Student");
    await editor.getByRole("button",{name:"Save role"}).click();
    await expect(page.getByRole("button",{name:"Promote lead"})).toBeVisible();

    // A project learner's access to /learn/projects is not a Mentor grant.
    await authenticate(context,"seed-learner",SEED_IDS.learnerCollegeAMembership);
    await page.goto(detailPath+"?tab=delivery");
    await expect(page).toHaveURL(/\/dashboard(?:[/?#]|$)/);
  });
});
