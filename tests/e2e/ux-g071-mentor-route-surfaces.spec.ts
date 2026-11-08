import {expect, test, type BrowserContext, type Page} from "@playwright/test";
import {authenticateGracefulRole} from "./support/roles";

const enabled=process.env.E2E_AUTH_ENABLED==="true" &&
  Boolean(process.env.E2E_AUTH_SECRET);

async function openSeededMentorProject(page:Page,context:BrowserContext) {
  await authenticateGracefulRole(context,"faculty");
  // Seeded faculty college A also has an actual MENTOR grant. This role
  // selector cannot grant a missing membership or a different tenant.
  await context.addCookies([{name:"lms_role",value:"MENTOR",url:"http://localhost:3000",
    sameSite:"Lax",httpOnly:true}]);
  await page.goto("/mentor/projects");
  const link=page.getByRole("link",{name:/E2E Mentor Acceptance Project/}).first();
  await expect(link).toBeVisible({timeout:30000});
  const href=await link.getAttribute("href");
  const id=href?.match(/\/mentor\/projects\/([0-9a-f-]{36})(?:[/?#]|$)/i)?.[1];
  expect(id,"Project link must come from the authorized mentor's live seeded portfolio")
    .toMatch(/^[a-f0-9-]{36}$/i);
  return id!;
}

test.describe("UX-G071 five persisted Mentor review route families",()=>{
  test.skip(!enabled,"Needs isolated seeded PostgreSQL with an assigned Mentor project");
  test.describe.configure({mode:"serial"});

  for(const viewport of [{name:"desktop",width:1280,height:800},
    {name:"mobile",width:390,height:844}] as const){
    test("Mentor reviews persisted closeout, resource and delivery history on "+viewport.name,
      async({page,context},info)=>{
        test.setTimeout(150000);
        await page.setViewportSize(viewport);
        const projectId=await openSeededMentorProject(page,context);
        const base="/mentor/projects/"+projectId;

        await page.goto(base+"/closeout");
        await expect(page.getByRole("heading",{level:1,name:"Project closeout"}))
          .toBeVisible();
        await expect(page.getByRole("heading",{name:"Persisted completion checklist"}))
          .toBeVisible();
        await expect(page.getByText("Latest final delivery approved")).toBeVisible();
        await page.screenshot({path:info.outputPath("g071-closeout-"+viewport.name+".png"),
          fullPage:true});

        await page.goto(base+"/resources-directory");
        await expect(page.getByRole("heading",{level:1,name:"Registered resource links"}))
          .toBeVisible();
        // FilterBar deliberately moves its search field into a responsive
        // drawer on phones; the launcher must expose a usable search there.
        if(viewport.width<768){
          const openFilters=page.getByRole("button",{name:"Filters",exact:true}).first();
          await expect(openFilters).toBeVisible();
          await openFilters.click();
          await expect(page.getByRole("searchbox")).toBeVisible();
          await page.keyboard.press("Escape");
        }else{
          await expect(page.getByRole("searchbox")).toBeVisible();
        }
        await expect(page.getByRole("link",{name:"Clear",exact:true})).toBeVisible();
        await page.screenshot({path:info.outputPath("g071-resources-"+viewport.name+".png"),
          fullPage:true});

        await page.goto(base+"/review-completeness");
        await expect(page.getByRole("heading",{level:1,name:"Delivery review completeness"}))
          .toBeVisible();
        // An opt-in, real learner DRAFT exists in disposable PG17.
        await expect(page.getByRole("heading",{name:"Delivery version 1"})).toBeVisible();
        const detail=page.getByRole("link",{name:"View delivery version 1 details"});
        await expect(detail).toBeVisible();
        const detailHref=await detail.getAttribute("href");
        expect(detailHref).toMatch(/\/deliveries\/[0-9a-f-]{36}\/review$/i);
        await page.screenshot({path:info.outputPath("g071-reviews-"+viewport.name+".png"),
          fullPage:true});
        await detail.click();
        await expect(page.getByRole("heading",{level:1,name:"Delivery version 1"}))
          .toBeVisible();
        await expect(page.getByText("E2E Mentor review completeness browser draft"))
          .toBeVisible();
        const back=page.getByRole("link",{name:"All delivery versions"});
        await expect(back).toBeVisible();
        await back.click();
        await expect(page).toHaveURL(new RegExp(
          "^http://localhost:3000"+base+"/review-completeness$","i"));
        await expect(page.getByRole("heading",{name:"Delivery version 1"})).toBeVisible();

        // A completed meeting is persisted under this very project, and its
        // notes page must read the stored outcome without leaking other data.
        await page.goto(base+
          "/meetings/77000000-0000-4000-8000-000000000071/notes");
        await expect(page.getByRole("heading",{level:1,
          name:"E2E Mentor review meeting"})).toBeVisible();
        await expect(page.getByRole("heading",{name:"Persisted meeting outcome"}))
          .toBeVisible();
        await expect(page.getByText(
          "Seeded documented retrospective for G071 browser acceptance."))
          .toBeVisible();
        await expect(page.getByRole("link",{name:"Meeting history"})).toBeVisible();
        await page.screenshot({path:info.outputPath(
          "g071-meeting-notes-"+viewport.name+".png"),fullPage:true});

        for(const suffix of ["/review-completeness?page=not-a-number",
          "/resources-directory?page=not-a-number"]){
          await page.goto(base+suffix);
          await expect(page.getByRole("alert").filter({hasText:/Invalid/}).first()).toBeVisible();
          const retry=page.getByRole("link",{name:/Clear invalid filters|Clear filters/});
          await expect(retry).toBeVisible();
          const target=await retry.getAttribute("href");
          expect(target).toContain(base);
          expect(target).not.toContain("not-a-number");
        }

        // Invalid identifiers must never show a valid project record.
        for(const suffix of [
          "/deliveries/00000000-0000-4000-8000-000000000099/review",
          "/meetings/00000000-0000-4000-8000-000000000099/notes",
        ]){
          const response=await page.request.get(base+suffix);
          const body=await response.text();
          // Next.js streamed App Router notFound() may return HTTP 200 after
          // the shell has started. Then require a real not-found document,
          // noindex metadata and no private review evidence.
          if(response.status()===200){
            expect(body,suffix+" must render the not-found boundary").toMatch(
              /This page could not be found|404: This page could not be found|Page Not Found/i);
            expect(body).toMatch(/name=["']robots["'][^>]*content=["']noindex/i);
          }else{
            expect([400,403,404],suffix+" must reject nonexistent details")
              .toContain(response.status());
          }
          expect(body).not.toContain("Registered reviewer feedback");
          expect(body).not.toContain("E2E Mentor review completeness browser draft");
        }
        expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth))
          .toBeLessThanOrEqual(2);
      });
  }

  test("Learner cannot read a Mentor project review, closeout, meetings or resources",
    async({page,context})=>{
      await openSeededMentorProject(page,context);
      const base=new URL(page.url()).pathname;
      // Last authorized link was retrieved while actor genuinely had a Mentor
      // grant. Switch to a different persisted person before the scope checks.
      const href=await page.getByRole("link",{name:/E2E Mentor Acceptance Project/})
        .first().getAttribute("href");
      const id=href?.match(/\/mentor\/projects\/([0-9a-f-]{36})(?:[/?#]|$)/i)?.[1];
      expect(id).toBeTruthy();
      await authenticateGracefulRole(context,"learner");
      for(const suffix of [
        "/closeout","/resources-directory","/review-completeness",
        "/deliveries/00000000-0000-4000-8000-000000000099/review",
        "/meetings/00000000-0000-4000-8000-000000000099/notes",
      ]){
        await page.goto("/mentor/projects/"+id+suffix);
        await expect(page,suffix+" must not show a Learner a Mentor route")
          .not.toHaveURL(new RegExp("/mentor/projects/"+id+"/"));
        await expect(page.getByText("Persisted completion checklist")).toHaveCount(0);
        await expect(page.getByText("E2E Mentor review completeness browser draft")).toHaveCount(0);
      }
      expect(base).toContain("/mentor/projects");
    });
});
