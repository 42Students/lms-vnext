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
    {
      // Persisted role selection, not a privilege grant: multi-role faculty
      // otherwise defaults to TPO in the isolated seed.
      name: "lms_role",
      value: identityUid==="seed-shared-faculty"?"MENTOR":
        identityUid==="seed-learner"?"LEARNER":"COLLEGE_ADMIN",
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

  test("college workspace creation persists Mentor and learner grants and permits Mentor team changes",async({
    page,context,
  })=>{
    await authenticate(context,"seed-college-admin",SEED_IDS.collegeAdminMembership);
    await page.goto("/college/projects");
    await expect(page.getByRole("heading",{level:1,name:"Project workspaces"})).toBeVisible();
    await page.getByRole("link",{name:"Create workspace"}).click();
    await expect(page.getByRole("heading",{level:1,name:"Create project workspace"})).toBeVisible();

    const unique=Date.now().toString();
    const title="Mentor Browser Project "+unique;
    const form=page.getByRole("region",{name:"Create workspace"});
    await form.getByLabel("Workspace title").fill(title);
    await form.getByLabel("Template",{exact:true}).selectOption({index:1});
    await expect(form.getByLabel("Slug (automatically suggested)"))
      .toHaveValue("mentor-browser-project-"+unique);
    // Real persisted Mentor choice: a fake request role must never grant a roster.
    const mentor=form.getByLabel("Primary mentor",{exact:true});
    await expect(mentor.locator("option[value='"+SEED_IDS.facultyCollegeAMembership+"']"))
      .toHaveCount(1);
    await mentor.selectOption(SEED_IDS.facultyCollegeAMembership);
    const learner=form.getByRole("checkbox",{name:/Seed Learner/});
    await expect(learner).toBeVisible();
    await learner.check();
    const created=page.waitForResponse(response=>
      response.url().endsWith("/api/projects")&&
      response.request().method()==="POST");
    await form.getByRole("button",{name:"Create workspace"}).click();
    const response=await created;
    expect(response.ok()).toBe(true);
    const payload=await response.json() as {project?:{id?:string}};
    const id=payload.project?.id;
    expect(id).toMatch(/^[0-9a-f-]{36}$/i);

    await authenticate(context,"seed-learner",SEED_IDS.learnerCollegeAMembership);
    await page.goto("/learn/projects");
    await expect(page.getByRole("link",{name:new RegExp(title)}).first())
      .toBeVisible();
    await page.goto("/learn/projects/"+id+"?tab=overview");
    await expect(page.getByRole("heading",{level:1,name:title})).toBeVisible();
    await expect(page.getByRole("button",{name:"Add teammate"})).toHaveCount(0);

    await authenticate(context,"seed-shared-faculty",SEED_IDS.facultyCollegeAMembership);
    await page.goto("/mentor/projects/"+id+"?tab=team");
    await expect(page.getByRole("heading",{level:1,name:title})).toBeVisible();
    await expect(page.getByText("Seed Learner",{exact:true}).first()).toBeVisible();
    const lead=page.getByRole("button",{name:"Promote lead"});
    await expect(lead).toBeVisible();
    await lead.click();
    await expect(page.getByRole("button",{name:"Remove lead"})).toBeVisible();
    await page.getByRole("button",{name:"Edit role"}).click();
    const editor=page.getByRole("dialog",{
      name:/Edit Seed Learner's project responsibility/,
    });
    await editor.getByLabel("Responsibility label").fill("Student");
    await editor.getByRole("button",{name:"Save role"}).click();
    await expect(page.getByRole("button",{name:"Promote lead"})).toBeVisible();

    // Revoking the user role cookie cannot make a Learner into a Mentor.
    await authenticate(context,"seed-learner",SEED_IDS.learnerCollegeAMembership);
    await page.goto("/mentor/projects/"+id+"?tab=delivery");
    await expect(page).toHaveURL(/\\/dashboard(?:[/?#]|$)/);
  });
});
