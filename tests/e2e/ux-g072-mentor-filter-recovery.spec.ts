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
      // The sixth route reads actual persisted task feedback, not a comments
      // thread or a synthetic browser component.
      await page.goto(base+"?tab=board");
      const taskFeedbackLink=page.getByRole("link",{name:/Review recorded task feedback/}).first();
      await expect(taskFeedbackLink).toBeVisible();
      const feedbackHref=await taskFeedbackLink.getAttribute("href");
      expect(feedbackHref?.startsWith(base+"/tasks/")).toBe(true);
      expect(feedbackHref).toMatch(/\/tasks\/[0-9a-f-]{36}\/feedback$/i);
      await taskFeedbackLink.click();
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
    await page.goto("/mentor/projects/"+id+"?tab=board");
    const taskLink=page.getByRole("link",{name:/Review recorded task feedback/}).first();
    await expect(taskLink).toBeVisible();
    const feedbackHref=await taskLink.getAttribute("href");
    expect(feedbackHref).toMatch(/\/tasks\/[0-9a-f-]{36}\/feedback$/i);
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
