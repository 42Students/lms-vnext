import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const seeded = process.env.E2E_AUTH_ENABLED === "true" &&
  process.env.MENTOR_E2E_SEED_PROJECT === "true" &&
  Boolean(process.env.E2E_AUTH_SECRET);

async function authorizedMentorProject(page: Page, context: BrowserContext) {
  await authenticateGracefulRole(context, "faculty");
  // The seeded faculty membership also has a persisted MENTOR role in this college.
  await context.addCookies([{name:"lms_role", value:"MENTOR",
    url:"http://localhost:3000", sameSite:"Lax", httpOnly:true}]);
  await page.goto("/mentor/projects");
  const link=page.getByRole("link",{name:/E2E Mentor Acceptance Project/}).first();
  await expect(link).toBeVisible({timeout:30000});
  const href=await link.getAttribute("href");
  const id=href?.match(new RegExp("/mentor/projects/([0-9a-f-]{36})(?:[/?#]|$)","i"))?.[1];
  expect(id).toMatch(/^[0-9a-f-]{36}$/i);
  return id!;
}

test.describe("UX-G072 Mentor project-local invalid filter recovery",()=>{
  test.skip(!seeded, "Needs real assigned Mentor in isolated seeded PostgreSQL");
  for(const viewport of [{name:"desktop",width:1280,height:800},
    {name:"mobile",width:390,height:844}] as const){
    test(viewport.name+" invalid filter states preserve authorized project context",
      async({page,context},info)=>{
      test.setTimeout(120000);
      await page.setViewportSize(viewport);
      const id=await authorizedMentorProject(page,context);
      const base="/mentor/projects/"+id;
      for(const [route,query] of [
        ["review-overview","?page=invalid"],
        ["risk-readiness","?focus=UNKNOWN"],
        ["team-history","?page=invalid"],
        ["team-meetings","?status=ALL&status=CANCELLED"],
        ["timeline","?page=invalid"],
      ] as const){
        await page.goto(base+"/"+route+query);
        const clear=page.getByRole("link",{name:"Clear invalid filters"});
        await expect(clear).toBeVisible();
        await expect(clear).toHaveAttribute("href",base+"/"+route);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))
          .toBeLessThanOrEqual(2);
        await clear.click();
        await expect(page).toHaveURL("http://localhost:3000"+base+"/"+route);
        await expect(page.getByRole("heading",{level:1})).toBeVisible();
      }
      // Exercise real authorized form submissions, not just synthetic
      // invalid-link fallbacks. A valid filter with zero matches must never
      // imply that every delivery record for this project is absent.
      await page.goto(base+"/review-overview");
      await expect(page.getByRole("heading",{name:"Delivery review overview"}))
        .toBeVisible();
      await page.locator('input[name="version"]').fill("1000000");
      await page.getByRole("search",{name:"Delivery review filters"})
        .getByRole("button",{name:"Filter"}).click();
      await expect(page).toHaveURL(/review-overview\\?[^#]*version=1000000/);
      await expect(page.getByText("No delivery versions match these filters"))
        .toBeVisible();
      await expect(page.getByRole("status").filter({hasText:"registered delivery version"}))
        .toContainText("match the selected filters");
      await expect(page.getByRole("link",{name:/Export filtered delivery review CSV/}))
        .toHaveAttribute("href",new RegExp("version=1000000"));
      await page.screenshot({path:info.outputPath("ux-g072-filtered-empty-"+viewport.name+".png"),
        fullPage:true});
      await page.getByRole("link",{name:"Clear",exact:true}).click();
      await expect(page).toHaveURL("http://localhost:3000"+base+"/review-overview");

      await page.goto(base+"/risk-readiness");
      await expect(page.getByRole("heading",{name:"At-risk & readiness drill-in"}))
        .toBeVisible();
      await page.locator('select[name="focus"]').selectOption("RISK");
      await page.locator('select[name="taskPriority"]').selectOption("CRITICAL");
      await page.getByRole("search",{name:"Risk readiness filters"})
        .getByRole("button",{name:"Filter"}).click();
      await expect(page).toHaveURL(/risk-readiness\\?[^#]*focus=RISK/);
      await expect(page.locator('select[name="taskPriority"]')).toHaveValue("CRITICAL");
      await expect(page.getByRole("status").filter({hasText:"recorded evidence item"}))
        .toContainText("match the selected filters");
      await page.screenshot({path:info.outputPath("ux-g072-risk-filter-"+viewport.name+".png"),
        fullPage:true});
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))
        .toBeLessThanOrEqual(2);
      await page.getByRole("link",{name:"Clear",exact:true}).click();
      await expect(page).toHaveURL("http://localhost:3000"+base+"/risk-readiness");

      // The sixth route reads actual persisted task feedback, not a comments
      // thread or a synthetic browser component.
      // The isolated fixture registers this task under the authorized project.
      // A task may be off-board until its sprint is active; its protected
      // feedback detail must still support a direct deep link.
      const feedbackHref=base+"/tasks/77000000-0000-4000-8000-000000000073/feedback";
      await page.goto(feedbackHref);
      await expect(page.getByRole("heading",{level:1,name:"Recorded task review feedback"}))
        .toBeVisible();
      await expect(page.getByText("G072 persisted reviewer feedback: refine the delivery proof."))
        .toBeVisible();
      await expect(page.getByText("Conversation thread unavailable")).toBeVisible();
      await expect(page.getByText("private-g072-task-source")).toHaveCount(0);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))
        .toBeLessThanOrEqual(2);
      await page.screenshot({path:info.outputPath("ux-g072-task-feedback-"+viewport.name+".png"),fullPage:true});

      await page.screenshot({path:info.outputPath("ux-g072-"+viewport.name+".png"),
        fullPage:true});
    });
  }

  test("unauthorized Learner cannot recover into a Mentor project",async({page,context})=>{
    const id=await authorizedMentorProject(page,context);
    const feedbackHref="/mentor/projects/"+id+
      "/tasks/77000000-0000-4000-8000-000000000073/feedback";
    await authenticateGracefulRole(context,"learner");
    await page.goto(feedbackHref!);
    await expect(page).not.toHaveURL(new RegExp("/mentor/projects/"+id+"/"));
    await expect(page.getByText("G072 persisted reviewer feedback")).toHaveCount(0);
    for(const route of ["review-overview","risk-readiness","team-history",
      "team-meetings","timeline"]){
      // The Next.js App Router can stream a 200 shell followed by a
      // forbidden redirect. Test the actual navigation and rendered privacy
      // boundary, never status-code presence alone.
      await page.goto("/mentor/projects/"+id+"/"+route+"?page=invalid");
      await expect(page,route+" must redirect an unauthorized Learner")
        .not.toHaveURL(new RegExp("/mentor/projects/"+id+"/"));
      await expect(page.getByText("E2E Mentor Acceptance Project")).toHaveCount(0);
      await expect(page.getByRole("link",{name:"Clear invalid filters"})).toHaveCount(0);
    }
  });
});
