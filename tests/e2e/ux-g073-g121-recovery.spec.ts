import { expect, test } from "@playwright/test";
import { authenticateGracefulRole } from "./support/roles";

const viewports = [
  {name:"desktop",width:1280,height:800},
  {name:"mobile",width:390,height:844},
] as const;

test.describe("UX-G073 and UX-G121 authenticated role and recovery journeys", () => {
  test.skip(process.env.UX_G073_G121_SEED !== "true",
    "Needs dedicated disposable PostgreSQL and real seeded auth memberships");

  for (const size of viewports) {
    test("G073 Mentor invalid filters recover without loading records on "+size.name,async({page,context},testInfo)=>{
      await authenticateGracefulRole(context,"mentor");
      await page.setViewportSize(size);
      for(const route of ["reports","review-history","reviews","sprint-progress","task-review-history"]){
        await page.goto("/mentor/"+route+"?page=not-a-number");
        const alert=page.getByRole("alert").filter({hasText:"Invalid"}).first();
        await expect(alert).toBeVisible();
        await expect(alert.getByRole("link",{name:"Clear filters"})).toHaveAttribute("href","/mentor/"+route);
        if(route!=="reviews")await expect(alert).toContainText("No ");
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      }
      await page.screenshot({path:testInfo.outputPath("g073-recovery-"+size.name+".png"),fullPage:true});
    });

    test("G073 Mentor filtered review queue offers useful clear action on "+size.name,async({page,context},testInfo)=>{
      await authenticateGracefulRole(context,"mentor");
      await page.setViewportSize(size);
      await page.goto("/mentor/reviews?search=UX_G073_NONEXISTENT_QUEUE");
      await expect(page.getByRole("heading",{name:"Delivery review queue"})).toBeVisible();
      await expect(page.getByText("No submitted deliveries match these review filters.")).toBeVisible();
      await expect(page.getByRole("link",{name:"Clear filters"}).last()).toHaveAttribute("href","/mentor/reviews");
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:testInfo.outputPath("g073-empty-"+size.name+".png"),fullPage:true});
    });

    test("G121 Super Admin issue and audit filter recovery on "+size.name,async({page,context},testInfo)=>{
      await authenticateGracefulRole(context,"superadmin");
      await page.setViewportSize(size);
      await page.goto("/tracker/issues?status=NOT_A_STATUS");
      await expect(page.getByRole("heading",{name:"Issues"})).toBeVisible();
      await expect(page.getByText("Invalid issue filter.")).toBeVisible();
      await expect(page.getByRole("link",{name:"Reset filters"})).toHaveAttribute("href","/tracker/issues");
      await page.goto("/tracker/audit-findings?view=NOT_A_VIEW");
      await expect(page.getByText("Invalid audit findings filters.")).toBeVisible();
      await expect(page.getByRole("link",{name:"Reset filters"})).toHaveAttribute("href","/tracker/audit-findings?view=OPEN");
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await page.screenshot({path:testInfo.outputPath("g121-recovery-"+size.name+".png"),fullPage:true});
    });
  }

  test("negative: Learner cannot reach Mentor reports or Super Admin tracker",async({page,context})=>{
    await authenticateGracefulRole(context,"learner");
    await page.goto("/mentor/review-history?status=INVALID");
    await expect(page).not.toHaveURL(/\/mentor\/review-history(?:\?|$)/);
    await page.goto("/tracker/issues?status=INVALID");
    await expect(page).not.toHaveURL(/\/tracker\/issues(?:\?|$)/);
  });
});
